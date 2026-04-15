import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MaterialRequestRecord {
    id: string;
    requestType: string;
    description: string;
    quantity: string;
    requestedBy: string;
    approvedBy: string;
    status: "Pending" | "Approved" | "Rejected";
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const materialRequests: MaterialRequestRecord[] = [
    {
        id: "REQ-101",
        requestType: "Structural Steel",
        description: "TMT bars for 2nd floor slab reinforcement.",
        quantity: "5 Tons",
        requestedBy: "Eng. Amit Sharma",
        approvedBy: "PM - Vikram Singh",
        status: "Approved",
    },
    {
        id: "REQ-102",
        requestType: "Cement",
        description: "OPC 53 Grade cement for masonry work.",
        quantity: "200 Bags",
        requestedBy: "Eng. Sunil Dutt",
        approvedBy: "Pending",
        status: "Pending",
    },
];

// ─── Main Component ─────────────────────────────────────────────────────────────

const MaterialRequestPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<MaterialRequestRecord | null>(null);
    const [requestData, setRequestData] = useState<MaterialRequestRecord[]>(materialRequests);
    const [isEditMode, setIsEditMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [formData, setFormData] = useState({
        id: "",
        requestType: "",
        description: "",
        quantity: "",
        requestedBy: "Eng. Site User",
        approvedBy: "Pending",
        status: "Pending" as "Pending" | "Approved" | "Rejected",
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

    const handleOpenEdit = (record: MaterialRequestRecord) => {
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

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this requisition?")) {
            setRequestData(prev => prev.filter(t => t.id !== id));
            toast.success("Requisition deleted");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fill all required diagnostics.");
            return;
        }

        if (isEditMode) {
            setRequestData(prev => prev.map(t => t.id === formData.id ? {
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
            const newEntry: MaterialRequestRecord = {
                ...formData,
                id: `REQ-${100 + requestData.length + 1}`,
                approvedBy: "Pending",
            };
            setRequestData((prev) => [newEntry, ...prev]);
            toast.success("Material Request Submitted Successfully!");
        }
        setIsFormModalOpen(false);
    };

    return (
        <>
            <Navbar
                title="Material Requests"
                breadcrumb={["InfraPilot", "Engineer", "Approvals", "Material"]}
            />

            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter italic-none">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 text-inter">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1 font-inter">
                            Procurement & Logistics
                        </p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">
                            Material Requests
                        </h1>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xl font-inter">
                            Official requisition portal for site materials, consumables, and structural components.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 font-inter">
                        <button
                            onClick={handleOpenAdd}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-inter"
                        >
                            <span className="text-lg leading-none font-inter">+</span>
                            New Requisition
                        </button>
                    </div>
                </div>

                {/* ── Summary Stat Cards (Activity Style) ────────────────────── */}
                <div className="mb-8 font-inter text-inter">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 font-inter text-inter">
                        Request Overview
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-inter text-inter">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter text-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Total Requests</p>
                            <p className="text-2xl font-bold text-slate-900 font-inter">{requestData.length}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">All Time Baseline</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter text-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Approved</p>
                            <p className="text-2xl font-bold text-emerald-500 font-inter">
                                {requestData.filter(r => r.status === "Approved").length}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Released for Site</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter text-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Pending Review</p>
                            <p className="text-2xl font-bold text-amber-500 font-inter">
                                {requestData.filter(r => r.status === "Pending").length}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Awaiting PM Approval</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter text-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Fulfillment</p>
                            <p className="text-2xl font-bold text-blue-600 font-inter">88%</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Site Delivery Rate</p>
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
                            placeholder="Search by material or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                        />
                    </div>
                </div>

                {/* ── Requisition Grid ─────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-20">
                    {requestData
                        .filter(item => item.requestType.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((request) => (
                            <div
                                key={request.id}
                                className="group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer p-6"
                                onClick={() => setSelectedRequest(request)}
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${request.status === "Approved" ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white" : request.status === "Pending" ? "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white" : "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white"}`}>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors ${request.status === "Approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100" : request.status === "Pending" ? "bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-100" : "bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-100"}`}>
                                        {request.status}
                                    </span>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">{request.id}</span>
                                    </div>
                                    <h3 className="text-sm font-black text-slate-800 tracking-tight leading-snug group-hover:text-blue-600 transition-colors h-10 line-clamp-2">
                                        {request.requestType}
                                    </h3>
                                </div>

                                <div className="space-y-3 py-4 border-y border-slate-50 mb-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quantity</span>
                                        <span className="text-sm font-black text-blue-600 tabular-nums">{request.quantity}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Requested By</span>
                                        <span className="text-[10px] font-bold text-slate-700">{request.requestedBy}</span>
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
                                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(request); }}
                                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(request.id); }}
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

                    {requestData.filter(item => item.requestType.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                        <div className="col-span-full bg-white rounded-3xl p-20 text-center border border-slate-100 shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No requisitions found</p>
                            <p className="text-slate-300 text-xs mt-1">Try adjusting your search query.</p>
                        </div>
                    )}
                </div>

            </PageTransition>

            {/* ── DETAIL MODAL (Insight View) ────────────────────────────────── */}
            <Modal
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
                title="Material Insight"
                maxWidth="max-w-2xl"
            >
                {selectedRequest && (
                    <div className="bg-white p-6 italic-none font-inter text-inter">
                        {/* ── Blue Hero Card ────────────────────────────────── */}
                        <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl opacity-50 font-inter" />

                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2 font-inter">Procurement Requisition</p>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-black tracking-tight leading-tight font-inter">{selectedRequest.requestType}</h3>
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                        <svg className="w-6 h-6 opacity-40" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1 font-inter">Requisition Status</p>
                                        <p className="text-xl font-black font-inter">{selectedRequest.status.toUpperCase()}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1 font-inter">Total Quantity</p>
                                        <p className="text-xl font-black tabular-nums font-inter">{selectedRequest.quantity}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Diagnostic Floor ──────────────────────────────── */}
                        <div className="space-y-8 mb-10 px-1 font-inter">
                            {/* Requisition Data */}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 font-inter">Request Diagnostics</p>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-12 font-inter">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Log ID</p>
                                        <p className="text-sm font-black text-slate-800 tabular-nums font-inter">{selectedRequest.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Requested By</p>
                                        <p className="text-sm font-black text-slate-800 font-inter">{selectedRequest.requestedBy}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Approved By</p>
                                        <p className="text-sm font-black text-blue-600 font-inter">{selectedRequest.approvedBy}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Resource Priority</p>
                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight font-inter">Standard Acquisition</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 font-inter">Requirement Narrative</p>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 font-inter text-sm text-slate-600 leading-relaxed italic-none">
                                    {selectedRequest.description}
                                </div>
                            </div>

                            {/* Workflow Integrity */}
                            <div>
                                <div className="flex items-center gap-5 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 group font-inter">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm font-inter">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-xs font-black text-emerald-900 mb-0.5 uppercase tracking-wide font-inter">Workflow Integrity Verified</p>
                                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.2em] font-inter">Logged in Procurement Master</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Action Footer ─────────────────────────────────── */}
                        <div className="flex items-center gap-4 pt-6 border-t border-slate-50 font-inter">
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest font-inter"
                            >
                                Close Audit
                            </button>
                            <button
                                onClick={() => {
                                    handleOpenEdit(selectedRequest!);
                                    setSelectedRequest(null);
                                }}
                                className="flex-[1.5] px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 justify-center active:scale-95"
                            >
                                Modify Request
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setErrors({}); }}
                title={isEditMode ? "Modify Material Request" : "New Requisition"}
                maxWidth="max-w-4xl"
            >
                <div className="bg-white p-2 italic-none font-inter">
                    <form id="request-form" onSubmit={handleSubmit} className="p-6 md:p-10 space-y-12">
                        {/* Section 1: Requisition Identity */}
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-6 w-1 bg-blue-600 rounded-full" />
                                <h3 className="text-[11px] font-black text-slate-800 tracking-[0.2em] uppercase">Requisition Identity</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Request Type *</label>
                                    <input
                                        name="requestType"
                                        value={formData.requestType}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Structural Steel"
                                        className={`w-full px-5 py-4 bg-slate-50/50 border rounded-2xl text-sm font-bold text-slate-800 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/5 ${errors.requestType ? "border-rose-300" : "border-slate-100"}`}
                                    />
                                    {errors.requestType && <p className="text-[9px] font-bold text-rose-500 tracking-widest uppercase mt-1 ml-1">{errors.requestType}</p>}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Order Quantity *</label>
                                    <input
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 5 Tons"
                                        className={`w-full px-5 py-4 bg-slate-50/50 border rounded-2xl text-sm font-bold text-slate-800 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/5 ${errors.quantity ? "border-rose-300" : "border-slate-100"}`}
                                    />
                                    {errors.quantity && <p className="text-[9px] font-bold text-rose-500 tracking-widest uppercase mt-1 ml-1">{errors.quantity}</p>}
                                </div>
                            </div>
                        </section>

                        {/* Section 2: requirement Narrative */}
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-6 w-1 bg-emerald-500 rounded-full" />
                                <h3 className="text-[11px] font-black text-slate-800 tracking-[0.2em] uppercase">Requirement Narrative</h3>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description *</label>
                                <textarea
                                    name="description"
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Provide detailed material specifications and justification..."
                                    className={`w-full px-6 py-5 bg-slate-50/50 border rounded-[2rem] text-sm font-bold text-slate-600 leading-relaxed transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/5 ${errors.description ? "border-rose-300" : "border-slate-100"}`}
                                />
                                {errors.description && <p className="text-[9px] font-bold text-rose-500 tracking-widest uppercase mt-1 ml-1">{errors.description}</p>}
                            </div>
                        </section>

                        {/* Section 3: Supply Chain Control */}
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-6 w-1 bg-amber-500 rounded-full" />
                                <h3 className="text-[11px] font-black text-slate-800 tracking-[0.2em] uppercase">Supply Chain Control</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Requested By</label>
                                    <input name="requestedBy" value={formData.requestedBy} readOnly className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Approved By</label>
                                    <input name="approvedBy" value={formData.approvedBy} onChange={handleInputChange} placeholder="Authority Name" className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Clearance Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 outline-none appearance-none cursor-pointer">
                                        <option value="Pending">Pending</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Rejected">Rejected</option>
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
                        form="request-form"
                        className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95"
                    >
                        {isEditMode ? "Commit Changes" : "Add Requisition"}
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default MaterialRequestPage;
