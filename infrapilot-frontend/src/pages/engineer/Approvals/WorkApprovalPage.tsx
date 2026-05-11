import React, { useState, useMemo, useEffect, useCallback } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import {
    ClipboardCheck,
    CheckCircle2,
    AlertCircle,
    Zap,
    Search,
    Plus,
    Eye,
    FileText,
    Loader2,
    Check,
    X,
    Mail,
    Briefcase,
    Phone,
    RotateCcw
} from "lucide-react";
import { approvalService } from "../../../services/approvalService";
import type { CreateApprovalRequest } from "../../../services/approvalService";

const statusColors: Record<string, string> = {
    'Approved': 'bg-emerald-600',
    'Pending': 'bg-amber-600',
    'Hold': 'bg-rose-600',
    'Rejected': 'bg-red-600',
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface WorkApprovalRecord {
    id: number | string;
    entity_type: string;
    entity_id: number | string;
    status: "Pending" | "Approved" | "Rejected" | "Hold" | string;
    requested_by: number | string;
    approved_by: number | string | null;
    remarks: string | null;
}

const WorkApprovalPage = () => {
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Hold': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-rose-50 text-rose-600 border-rose-100';
        }
    };

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedApproval, setSelectedApproval] = useState<WorkApprovalRecord | null>(null);
    const [approvalData, setApprovalData] = useState<WorkApprovalRecord[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState<number | string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    // Filter state for StatCards
    const [activeFilter, setActiveFilter] = useState<"All" | "Approved" | "Pending" | "Rate">("All");

    const [formData, setFormData] = useState({
        id: "" as number | string,
        entity_type: "bill",
        entity_id: "" as number | string,
        remarks: "",
        status: "Pending" as "Pending" | "Approved" | "Rejected" | string,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const fetchApprovals = useCallback(async () => {
        try {
            setLoading(true);
            const serverData = await approvalService.getApprovals();
            setApprovalData(serverData);
        } catch (error) {
            console.error("Failed to fetch approvals", error);
            toast.error("Failed to sync work authorizations");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchApprovals();
    }, [fetchApprovals]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.entity_type.trim()) newErrors.entity_type = "Required";
        if (!formData.entity_id) newErrors.entity_id = "Required";
        if (!formData.remarks.trim()) newErrors.remarks = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        const toastId = toast.loading(isEditMode ? "Updating request..." : "Submitting request...");
        try {
            const payload: CreateApprovalRequest = {
                entity_type: formData.entity_type,
                entity_id: Number(formData.entity_id),
                remarks: formData.remarks
            };

            if (isEditMode) {
                toast.error("Update not implemented in service", { id: toastId });
            } else {
                await approvalService.createApproval(payload);
                toast.success("Work Approval Request Submitted!", { id: toastId });
                fetchApprovals();
            }
            setIsFormModalOpen(false);
        } catch (error) {
            console.error("Submit Error:", error);
            toast.error("Failed to process request", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApprove = async (id: number) => {
        const remarks = prompt("Enter approval remarks:", "Approved after site review");
        if (remarks === null) return;

        const toastId = toast.loading("Processing approval...");
        try {
            await approvalService.approve(id, remarks);
            toast.success("Work Authorized!", { id: toastId });
            fetchApprovals();
        } catch (error) {
            toast.error("Approval failed", { id: toastId });
        }
    };

    const handleReject = async (id: number) => {
        const remarks = prompt("Enter rejection remarks:", "Rejected due to technical non-compliance");
        if (remarks === null) return;

        const toastId = toast.loading("Processing rejection...");
        try {
            await approvalService.reject(id, remarks);
            toast.success("Work Authorization Rejected", { id: toastId });
            fetchApprovals();
        } catch (error) {
            toast.error("Rejection failed", { id: toastId });
        }
    };

    const handleDeleteConfirm = () => {
        if (!requestToDelete) return;
        setApprovalData(prev => prev.filter(a => a.id !== requestToDelete));
        toast.success("Request deleted");
        setIsDeleteModalOpen(false);
        setRequestToDelete(null);
    };

    const filteredApprovals = useMemo(() => {
        let data = approvalData;
        
        // Apply StatCard Filter
        if (activeFilter === "Approved") {
            data = data.filter(a => a.status === "Approved");
        } else if (activeFilter === "Pending") {
            data = data.filter(a => a.status !== "Approved");
        } else if (activeFilter === "Rate") {
            // Rate filter shows everything or maybe just the cleared ones?
            // User said "Rate par click karte hi list page ki sari overall percentage dikhani chaiye"
            // Usually this means showing all data but focused on the rate metric.
            // I'll show all data for "Rate" as well.
            data = approvalData;
        }

        // Apply Search Filter
        return data.filter(a =>
            a.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(a.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.remarks && a.remarks.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [approvalData, searchTerm, activeFilter]);

    const stats = useMemo(() => {
        const total = approvalData.length;
        const cleared = approvalData.filter(a => a.status === "Approved").length;
        const pending = approvalData.filter(a => a.status !== "Approved").length;
        const rate = total > 0 ? Math.round((cleared / total) * 100) : 0;
        return {
            total,
            cleared,
            pending,
            clearanceRate: `${rate}%`
        };
    }, [approvalData]);

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
    const inputClasses = (error?: string) => `
        w-full px-4 py-2.5 bg-white border 
        ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} 
        rounded-xl text-sm outline-none transition-all placeholder:text-slate-300
    `;

    return (
        <>
            <Navbar title="Work Approvals" breadcrumb={["Engineer", "Approvals", "Technical Clearance"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none">Work Authorizations</h1>
                        <p className="text-slate-500 text-sm italic-none">Technical clearance portal for critical site activities and execution milestones.</p>
                    </div>
                    <button
                        onClick={() => {
                            setIsEditMode(false);
                            setFormData({
                                id: "",
                                entity_type: "bill",
                                entity_id: "",
                                remarks: "",
                                status: "Pending"
                            });
                            setErrors({});
                            setIsFormModalOpen(true);
                        }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Log Request
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div onClick={() => setActiveFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeFilter === "All" ? "ring-2 ring-primary bg-primary/5 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Total Logs"
                            value={stats.total.toString()}
                            sub="Activity Baseline"
                            accent="text-slate-800"
                            icon={<ClipboardCheck className={`w-5 h-5 ${activeFilter === "All" ? "text-primary scale-110" : "text-slate-400 group-hover:text-primary"} transition-all`} />}
                        />
                    </div>
                    <div onClick={() => setActiveFilter("Approved")} className={`cursor-pointer group transition-all rounded-xl ${activeFilter === "Approved" ? "ring-2 ring-emerald-500 bg-emerald-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Cleared"
                            value={stats.cleared.toString()}
                            sub="Work Authorized"
                            accent="text-emerald-500"
                            icon={<CheckCircle2 className={`w-5 h-5 ${activeFilter === "Approved" ? "text-emerald-500 scale-110" : "text-slate-400 group-hover:text-emerald-500"} transition-all`} />}
                        />
                    </div>
                    <div onClick={() => setActiveFilter("Pending")} className={`cursor-pointer group transition-all rounded-xl ${activeFilter === "Pending" ? "ring-2 ring-rose-500 bg-rose-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Held / Pending"
                            value={stats.pending.toString()}
                            sub="Awaiting Clearance"
                            accent="text-rose-500"
                            icon={<AlertCircle className={`w-5 h-5 ${activeFilter === "Pending" ? "text-rose-500 scale-110" : "text-slate-400 group-hover:text-rose-500"} transition-all`} />}
                        />
                    </div>
                    <div onClick={() => setActiveFilter("Rate")} className={`cursor-pointer group transition-all rounded-xl ${activeFilter === "Rate" ? "ring-2 ring-blue-500 bg-blue-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Clearance Rate"
                            value={stats.clearanceRate}
                            sub="Avg Site Precision"
                            accent="text-blue-500"
                            icon={<Zap className={`w-5 h-5 ${activeFilter === "Rate" ? "text-blue-500 scale-110" : "text-slate-400 group-hover:text-blue-500"} transition-all`} />}
                        />
                    </div>
                </div>

                {/* ── Filter Bar & Table Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
                    {/* Integrated Filter Bar */}
                    <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by activity, ID or remarks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter font-bold"
                            />
                        </div>
                        <div className="flex items-center gap-3 font-inter">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Filter:</span>
                            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-primary uppercase tracking-widest shadow-sm">
                                {activeFilter === "Rate" ? "Overall Precision" : activeFilter === "All" ? "Full Ledger" : activeFilter}
                            </span>
                            {activeFilter !== "All" && (
                                <button onClick={() => setActiveFilter("All")} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        <table className="w-full text-left font-inter min-w-[1200px]">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                    <th className="px-6 py-4">Work Authorization</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Entity Details</th>
                                    <th className="px-6 py-4">Requested By</th>
                                    <th className="px-6 py-4">Remarks</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-inter">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center font-inter">
                                            <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Authorizations...</p>
                                        </td>
                                    </tr>
                                ) : filteredApprovals.length > 0 ? (
                                    filteredApprovals.map((approval) => (
                                        <tr key={approval.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col font-inter">
                                                    <span className="text-sm font-bold text-slate-800 uppercase font-inter">{approval.entity_type}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">REF-{approval.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(approval.status)} font-inter`}>
                                                    {approval.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-black text-blue-600 font-inter italic-none">ID: {approval.entity_id}</span>
                                            </td>
                                            <td className="px-6 py-4 font-inter">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500">U</div>
                                                    <span className="text-xs font-bold text-slate-600 italic-none font-inter">User {approval.requested_by}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[11px] font-bold text-slate-400 truncate max-w-[250px] font-inter italic-none">
                                                    {approval.remarks || "No technical narrative narrated"}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 font-inter">
                                                    <button
                                                        onClick={() => setSelectedApproval(approval)}
                                                        className={`p-2 text-white rounded-xl shadow-lg transition-all active:scale-95 ${statusColors[approval.status as keyof typeof statusColors] || 'bg-primary'} shadow-primary/10 font-inter`}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {approval.status === "Pending" && (
                                                        <div className="flex items-center gap-1 border-l border-slate-100 pl-2 font-inter">
                                                            <button
                                                                onClick={() => handleApprove(Number(approval.id))}
                                                                className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                                                                title="Approve"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(Number(approval.id))}
                                                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                                title="Reject"
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
                                        <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic-none font-inter">
                                            No authorization requests discovered in the project vault.
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
                isOpen={!!selectedApproval}
                onClose={() => setSelectedApproval(null)}
                title="Work Authorization Insight"
                maxWidth="max-w-xl"
            >
                {selectedApproval && (
                    <div className="p-6 font-inter text-inter italic-none">
                        {/* ── Profile Style Header ────────────────── */}
                        <div className={`${statusColors[selectedApproval.status as keyof typeof statusColors] || 'bg-primary'} rounded-[2rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter`}>
                            <div className="relative z-10 flex items-center gap-6 font-inter text-white">
                                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 relative font-inter">
                                    <span className="text-4xl font-black font-inter italic-none">{selectedApproval.entity_type.charAt(0).toUpperCase()}</span>
                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${selectedApproval.status === 'Approved' ? 'bg-emerald-400' : 'bg-amber-400'} border-4 border-white/20 rounded-full animate-pulse`} />
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-black tracking-tight font-inter italic-none uppercase">{selectedApproval.entity_type} CLEARANCE</h3>
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedApproval.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-100' : 'bg-amber-500/20 text-amber-100'}`}>
                                            {selectedApproval.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[11px] font-bold font-inter italic-none">approval.ref-{String(selectedApproval.id).toLowerCase()}@infrapilot.com</span>
                                    </div>
                                    <div className="px-3 py-1 bg-white/20 rounded-full inline-block font-inter">
                                        <span className="text-[10px] font-black uppercase tracking-widest font-inter">ENTITY ID: {selectedApproval.entity_id}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            {/* Operational Intelligence style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Briefcase className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Operational Intelligence</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Entity Category</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none uppercase">{selectedApproval.entity_type}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Entity Reference</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">#LOG-{selectedApproval.entity_id}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Authorization Status</p>
                                        <p className={`text-sm font-black font-inter italic-none ${selectedApproval.status === 'Approved' ? 'text-emerald-500' : 'text-amber-500'}`}>{selectedApproval.status.toUpperCase()}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">System Ref</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">AUT-{selectedApproval.id}X</p>
                                    </div>
                                </div>
                            </div>

                            {/* Technical Narrative Section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Phone className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Technical Narrative</p>
                                </div>
                                <div className="grid grid-cols-1 gap-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Audit Trail & Remarks</p>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-inter italic-none">
                                            "{selectedApproval.remarks || "No additional technical scope narrated for this authorization request."}"
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Audit Integrity Section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <FileText className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Audit Integrity</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Requested By</p>
                                        <p className="text-sm font-black text-blue-600 font-inter italic-none">User {selectedApproval.requested_by}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">System Sync</p>
                                        <p className="text-sm font-black text-emerald-500 font-inter italic-none">Verified Request</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedApproval(null)}
                            className={`w-full py-4 ${statusColors[selectedApproval.status as keyof typeof statusColors] || 'bg-primary'} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 shadow-primary/20 font-inter italic-none`}
                        >
                            Dismiss Authorization Insight
                        </button>
                    </div>
                )}
            </Modal>

            {/* ── Form Modal ────────────────────────────────── */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={isEditMode ? "Modify Work Approval" : "New Work Request"}
                maxWidth="max-w-4xl"
                footer={
                    <div className="flex justify-end gap-3 px-6 pb-6">
                        <button onClick={() => setIsFormModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors font-inter">
                            Cancel
                        </button>
                        <button
                            form="approval-form"
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 font-inter"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : null}
                            {isEditMode ? "Update Request" : "Submit Request"}
                        </button>
                    </div>
                }
            >
                <form id="approval-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">Authorization Identity</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-inter">
                            <div>
                                <label className={labelClasses}>Entity Type <span className="text-rose-500">*</span></label>
                                <select name="entity_type" value={formData.entity_type} onChange={handleInputChange} className={inputClasses(errors.entity_type)}>
                                    <option value="bill">Bill</option>
                                    <option value="material">Material</option>
                                    <option value="labour">Labour</option>
                                    <option value="equipment">Equipment</option>
                                </select>
                                {errors.entity_type && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 font-inter">{errors.entity_type}</p>}
                            </div>
                            <div>
                                <label className={labelClasses}>Entity ID <span className="text-rose-500">*</span></label>
                                <input name="entity_id" type="number" value={formData.entity_id} onChange={handleInputChange} placeholder="e.g. 1" className={inputClasses(errors.entity_id)} />
                                {errors.entity_id && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 font-inter">{errors.entity_id}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">Technical Narrative</h3>
                        <div className="font-inter">
                            <label className={labelClasses}>Remarks <span className="text-rose-500">*</span></label>
                            <textarea name="remarks" rows={4} value={formData.remarks} onChange={handleInputChange} placeholder="Describe the technical requirements or justification..." className={`${inputClasses(errors.remarks)} resize-none font-inter font-bold`} />
                            {errors.remarks && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 font-inter">{errors.remarks}</p>}
                        </div>
                    </div>

                </form>
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Work Request"
                message="Are you sure you want to delete this work approval request? This action cannot be undone."
                confirmText="Delete"
                type="danger"
            />
        </>
    );
};

export default WorkApprovalPage;
