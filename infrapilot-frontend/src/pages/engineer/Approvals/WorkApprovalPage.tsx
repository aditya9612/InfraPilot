import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WorkApprovalRecord {
    id: string;
    requestType: string;
    description: string;
    quantity: string;
    requestedBy: string;
    approvedBy: string;
    status: "Pending" | "Approved" | "Hold";
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const workApprovals: WorkApprovalRecord[] = [
    {
        id: "WAP-201",
        requestType: "Concrete Pouring - Beam B12",
        description: "Requesting approval for M30 grade concrete pouring after reinforcement check.",
        quantity: "12 Cum",
        requestedBy: "Eng. Amit Sharma",
        approvedBy: "Sr. Eng. Sahil Kapur",
        status: "Approved",
    },
    {
        id: "WAP-202",
        requestType: "Plastering - Wing A",
        description: "Approval for internal plastering start on 2nd floor.",
        quantity: "450 Sqft",
        requestedBy: "Eng. Sunil Dutt",
        approvedBy: "Pending",
        status: "Pending",
    },
];

// ─── Main Component ─────────────────────────────────────────────────────────────

const WorkApprovalPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedApproval, setSelectedApproval] = useState<WorkApprovalRecord | null>(null);
    const [approvalData, setApprovalData] = useState<WorkApprovalRecord[]>(workApprovals);
    const [isEditMode, setIsEditMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        id: "",
        requestType: "",
        description: "",
        quantity: "",
        requestedBy: "Eng. Site User",
        approvedBy: "Pending",
        status: "Pending" as "Pending" | "Approved" | "Hold",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => {
                const newErrs = { ...prev };
                delete newErrs[name];
                return newErrs;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.requestType) newErrors.requestType = "Required";
        if (!formData.quantity) newErrors.quantity = "Required";
        if (!formData.description) newErrors.description = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleOpenAdd = () => {
        setIsEditMode(false);
        setFormData({
            id: "",
            requestType: "",
            description: "",
            quantity: "",
            requestedBy: "Eng. Site User",
            approvedBy: "Pending",
            status: "Pending",
        });
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (record: WorkApprovalRecord) => {
        setIsEditMode(true);
        setFormData({
            id: record.id,
            requestType: record.requestType,
            description: record.description,
            quantity: record.quantity,
            requestedBy: record.requestedBy,
            approvedBy: record.approvedBy,
            status: record.status,
        });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setRequestToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!requestToDelete) return;
        setApprovalData(prev => prev.filter(t => t.id !== requestToDelete));
        toast.success("Request deleted");
        setIsDeleteModalOpen(false);
        setRequestToDelete(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fill all required diagnostics.");
            return;
        }

        if (isEditMode) {
            setApprovalData(prev => prev.map(t => t.id === formData.id ? {
                ...t,
                requestType: formData.requestType,
                description: formData.description,
                quantity: formData.quantity,
                requestedBy: formData.requestedBy,
                approvedBy: formData.approvedBy,
                status: formData.status,
            } : t));
            toast.success("Request Updated!");
        } else {
            const newEntry: WorkApprovalRecord = {
                ...formData,
                id: `WAP-${200 + approvalData.length + 1}`,
                approvedBy: "Verification Pending",
            };
            setApprovalData((prev) => [newEntry, ...prev]);
            toast.success("Work Approval Request Submitted!");
        }
        setIsFormModalOpen(false);
    };

    return (
        <>
            <Navbar
                title="Work Approvals"
                breadcrumb={["InfraPilot", "Engineer", "Approvals", "Work"]}
            />

            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter italic-none">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 text-inter">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1 font-inter">
                            Work Execution Control
                        </p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">
                            Work Approvals
                        </h1>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xl font-inter">
                            Technical clearance portal for critical site activities, engineering benchmarks, and execution milestones.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 font-inter">
                        <button
                            onClick={handleOpenAdd}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-inter"
                        >
                            <span className="text-lg leading-none font-inter">+</span>
                            New Work Request
                        </button>
                    </div>
                </div>

                {/* ── Summary Stat Cards (Activity Style) ────────────────────── */}
                <div className="mb-8 font-inter text-inter">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 font-inter text-inter">
                        Approval Summary
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-inter text-inter">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter text-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Total Requests</p>
                            <p className="text-2xl font-bold text-slate-900 font-inter">{approvalData.length}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Activity Baseline</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter text-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Cleared</p>
                            <p className="text-2xl font-bold text-emerald-500 font-inter">
                                {approvalData.filter(a => a.status === "Approved").length}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Work Authorized</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter text-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Held / Pending</p>
                            <p className="text-2xl font-bold text-rose-500 font-inter">
                                {approvalData.filter(a => a.status !== "Approved").length}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Awaiting Clearance</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter text-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Clearance Rate</p>
                            <p className="text-2xl font-bold text-blue-600 font-inter">94%</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Avg Site Precision</p>
                        </div>
                    </div>
                </div>

                {/* ── Filter Bar ───────────────────────────────────────────── */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by activity or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                        />
                    </div>
                </div>

                {/* ── Approval Grid ─────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-20">
                    {approvalData
                        .filter(item =>
                            item.requestType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.description.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((approval) => (
                            <div
                                key={approval.id}
                                className="group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer p-6"
                                onClick={() => setSelectedApproval(approval)}
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${approval.status === "Approved" ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white" : approval.status === "Pending" ? "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white" : "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white"}`}>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors ${approval.status === "Approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100" : approval.status === "Pending" ? "bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-100" : "bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-100"}`}>
                                        {approval.status}
                                    </span>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">{approval.id}</span>
                                    </div>
                                    <h3 className="text-sm font-black text-slate-800 tracking-tight leading-snug group-hover:text-blue-600 transition-colors h-10 line-clamp-2">
                                        {approval.requestType}
                                    </h3>
                                </div>

                                <div className="space-y-3 py-4 border-y border-slate-50 mb-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Qty</span>
                                        <span className="text-sm font-black text-blue-600 tabular-nums">{approval.quantity}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">By</span>
                                        <span className="text-[10px] font-bold text-slate-700">{approval.requestedBy}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-600 transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        <span className="text-[10px] font-black uppercase tracking-widest">View Detail</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(approval); }}
                                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(approval.id); }}
                                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                    {approvalData.filter(item => item.requestType.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                        <div className="col-span-full bg-white rounded-3xl p-20 text-center border border-slate-100 shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No approval requests found</p>
                            <p className="text-slate-300 text-xs mt-1">Try adjusting your search query.</p>
                        </div>
                    )}
                </div>

            </PageTransition>

            {/* ── DETAIL MODAL (Insight View) ────────────────────────────────── */}
            <Modal
                isOpen={!!selectedApproval}
                onClose={() => setSelectedApproval(null)}
                title="Approval Insight"
                maxWidth="max-w-2xl"
            >
                {selectedApproval && (
                    <div className="bg-white p-6 italic-none font-inter text-inter">
                        {/* ── Blue Hero Card ────────────────────────────────── */}
                        <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl opacity-50 font-inter" />

                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Work Authorization</p>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-black tracking-tight leading-tight font-inter">{selectedApproval.requestType}</h3>
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                        <svg className="w-6 h-6 opacity-40" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm3.3 14.71L12 13.41l-3.29 3.3-1.42-1.42 3.3-3.29-3.3-3.29 1.42-1.42 3.29 3.3 3.29-3.3 1.42 1.42-3.3 3.29 3.3 3.29-1.42 1.42z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Authorization Status</p>
                                        <p className="text-xl font-black">{selectedApproval.status.toUpperCase()}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Target Quantity</p>
                                        <p className="text-xl font-black tabular-nums">{selectedApproval.quantity}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Diagnostic Floor ──────────────────────────────── */}
                        <div className="space-y-8 mb-10 px-1">
                            {/* Requisition Data */}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 font-inter">Request Diagnostics</p>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Request ID</p>
                                        <p className="text-sm font-black text-slate-800 tabular-nums">{selectedApproval.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Requested By</p>
                                        <p className="text-sm font-black text-slate-800">{selectedApproval.requestedBy}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Verified By</p>
                                        <p className="text-sm font-black text-blue-600">{selectedApproval.approvedBy}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Phase Control</p>
                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Active Execution</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 font-inter">Technical Narrative</p>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 font-inter text-sm text-slate-600 leading-relaxed italic-none">
                                    {selectedApproval.description}
                                </div>
                            </div>

                            {/* Workflow Integrity */}
                            <div>
                                <div className="flex items-center gap-5 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 group">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-emerald-900 mb-0.5 uppercase tracking-wide">Ready for Initiation</p>
                                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Authorized Technical Sequence</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Action Footer ─────────────────────────────────── */}
                        <div className="flex items-center gap-4 pt-6 border-t border-slate-50 font-inter">
                            <button
                                onClick={() => setSelectedApproval(null)}
                                className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest font-inter"
                            >
                                Close Audit
                            </button>
                            <button
                                onClick={() => {
                                    handleOpenEdit(selectedApproval!);
                                    setSelectedApproval(null);
                                }}
                                className="flex-[1.5] px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 justify-center active:scale-95"
                            >
                                Modify Request
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── FORM MODAL (Add / Edit) ────────────────────────────────── */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setErrors({}); }}
                title={isEditMode ? "Modify Work Approval" : "New Work Request"}
                maxWidth="max-w-4xl"
            >
                <div className="bg-white p-2 italic-none font-inter">
                    <form id="approval-form" onSubmit={handleSubmit} className="p-6 md:p-10 space-y-12">
                        {/* Section 1: Authorization Identity */}
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-6 w-1 bg-blue-600 rounded-full" />
                                <h3 className="text-[11px] font-black text-slate-800 tracking-[0.2em] uppercase">Authorization Identity</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Request Type *</label>
                                    <input
                                        name="requestType"
                                        value={formData.requestType}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Concrete Pouring"
                                        className={`w-full px-5 py-4 bg-slate-50/50 border rounded-2xl text-sm font-bold text-slate-800 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/5 ${errors.requestType ? "border-rose-300" : "border-slate-100"}`}
                                    />
                                    {errors.requestType && <p className="text-[9px] font-bold text-rose-500 tracking-widest uppercase mt-1 ml-1">{errors.requestType}</p>}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Target Quantity *</label>
                                    <input
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 500 Sqft"
                                        className={`w-full px-5 py-4 bg-slate-50/50 border rounded-2xl text-sm font-bold text-slate-800 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/5 ${errors.quantity ? "border-rose-300" : "border-slate-100"}`}
                                    />
                                    {errors.quantity && <p className="text-[9px] font-bold text-rose-500 tracking-widest uppercase mt-1 ml-1">{errors.quantity}</p>}
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Technical Scope */}
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-6 w-1 bg-emerald-500 rounded-full" />
                                <h3 className="text-[11px] font-black text-slate-800 tracking-[0.2em] uppercase">Technical Scope</h3>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Work Description *</label>
                                <textarea
                                    name="description"
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Describe the technical requirements and execution plan..."
                                    className={`w-full px-6 py-5 bg-slate-50/50 border rounded-[2rem] text-sm font-bold text-slate-600 leading-relaxed transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/5 ${errors.description ? "border-rose-300" : "border-slate-100"}`}
                                />
                                {errors.description && <p className="text-[9px] font-bold text-rose-500 tracking-widest uppercase mt-1 ml-1">{errors.description}</p>}
                            </div>
                        </section>

                        {/* Section 3: Workflow Control */}
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-6 w-1 bg-amber-500 rounded-full" />
                                <h3 className="text-[11px] font-black text-slate-800 tracking-[0.2em] uppercase">Workflow Control</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Requested By</label>
                                    <input name="requestedBy" value={formData.requestedBy} readOnly className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Verified By</label>
                                    <input name="approvedBy" value={formData.approvedBy} onChange={handleInputChange} placeholder="Authority Name" className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Clearance Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 outline-none appearance-none cursor-pointer">
                                        <option value="Pending">Pending</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Hold">Hold</option>
                                    </select>
                                </div>
                            </div>
                        </section>
                    </form>
                </div>

                <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex items-center justify-between font-inter">
                    <button
                        type="button"
                        onClick={() => setIsFormModalOpen(false)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-800 tracking-widest uppercase transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="approval-form"
                        className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95"
                    >
                        {isEditMode ? "Commit Changes" : "Add Work Request"}
                    </button>
                </div>
            </Modal>
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setRequestToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Work Request"
                message="Are you sure you want to delete this work approval request? This will permanently remove the authorization log and technical narrative from the system."
                confirmText="Delete"
                type="danger"
            />
        </>
    );
};

export default WorkApprovalPage;

