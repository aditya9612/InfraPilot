import React, { useState, useMemo, useEffect, useCallback } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import {
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
    ,
    ChevronLeft,
    ChevronRight,
    Clock,
    ChevronDown
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
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Filter state for StatCards
    const [activeFilter, setActiveFilter] = useState<"Select" | "Approved" | "Pending" | "Reject" | "Pending/Reject" | "Rate">("Select");
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

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
                const newRecord = await approvalService.createApproval(payload);
                toast.success("Work Approval Request Submitted!", { id: toastId });
                setApprovalData(prev => [newRecord, ...prev]);
            }
            setIsFormModalOpen(false);
        } catch (error) {
            console.error("Submit Error:", error);
            toast.error("Failed to process request", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApprove = async (id: number | string) => {
        const remarks = prompt("Enter approval remarks:", "Approved after site review");
        if (remarks === null) return;

        const toastId = toast.loading("Processing approval...");
        try {
            await approvalService.approve(id, remarks);
            toast.success("Work Authorized!", { id: toastId });

            // Optimistic Update
            setApprovalData(prev => prev.map(a =>
                a.id === id ? { ...a, status: "Approved" } : a
            ));
        } catch (error) {
            toast.error("Approval failed", { id: toastId });
        }
    };

    const handleReject = async (id: number | string) => {
        const remarks = prompt("Enter rejection remarks:", "Rejected due to technical non-compliance");
        if (remarks === null) return;

        const toastId = toast.loading("Processing rejection...");
        try {
            await approvalService.reject(id, remarks);
            toast.success("Work Authorization Rejected", { id: toastId });

            // Optimistic Update
            setApprovalData(prev => prev.map(a =>
                a.id === id ? { ...a, status: "Rejected" } : a
            ));
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

    const baseFilteredApprovals = useMemo(() => {
        return approvalData.filter(a =>
            a.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(a.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.remarks && a.remarks.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [approvalData, searchTerm]);

    const filteredApprovals = useMemo(() => {
        let data = [...baseFilteredApprovals];

        // Apply StatCard Filter
        if (activeFilter === "Approved") {
            data = data.filter(a => a.status === "Approved");
        } else if (activeFilter === "Pending") {
            data = data.filter(a => a.status === "Pending" || a.status === "Hold");
        } else if (activeFilter === "Reject") {
            data = data.filter(a => a.status === "Rejected");
        } else if (activeFilter === "Pending/Reject") {
            data = data.filter(a => a.status !== "Approved");
        }

        // Apply Sort Order
        data.sort((a, b) => {
            if (sortOrder === "latest") {
                return Number(b.id) - Number(a.id);
            } else {
                return Number(a.id) - Number(b.id);
            }
        });

        return data;
    }, [baseFilteredApprovals, activeFilter, sortOrder]);

    const paginatedApprovals = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredApprovals.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredApprovals, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredApprovals.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeFilter]);

    const stats = {
        total: baseFilteredApprovals.length,
        cleared: baseFilteredApprovals.filter(a => a.status === "Approved").length,
        pending: baseFilteredApprovals.filter(a => a.status !== "Approved").length,
        clearanceRate: `${baseFilteredApprovals.length > 0 ? Math.round((baseFilteredApprovals.filter(a => a.status === "Approved").length / baseFilteredApprovals.length) * 100) : 0}%`
    };

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";
    const inputClasses = (error?: string) => `
        w-full px-4 py-2.5 bg-white border 
        ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} 
        rounded-xl text-sm font-bold outline-none transition-all placeholder:text-slate-300 font-inter
    `;

    return (
        <>
            <Navbar title="Work Approvals" breadcrumb={["Engineer", "Approvals", "Technical Clearance"]} />

            <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto pb-8 font-inter flex flex-col">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Work Authorizations</h1>
                        <p className="text-slate-500 text-sm">Technical clearance portal for critical site activities and execution milestones.</p>
                    </div>
                    <div className="flex items-center gap-3">
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
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
                        >
                            <Plus className="w-4 h-4" />
                            Log Request
                        </button>
                        <button
                            onClick={fetchApprovals}
                            className="p-2 text-slate-400 hover:text-primary transition-colors bg-white rounded-xl border border-slate-200 shadow-sm font-inter active:scale-95"
                            title="Refetch Authorizations"
                        >
                            <RotateCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                    <div onClick={() => setActiveFilter("Select")} className={`cursor-pointer group transition-all rounded-xl ${activeFilter === "Select" ? "ring-2 ring-primary/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Total Logs"
                            value={stats.total.toString()}
                            sub="Activity Baseline"
                            accent="text-slate-800" />
                    </div>
                    <div onClick={() => setActiveFilter("Approved")} className={`cursor-pointer group transition-all rounded-xl ${activeFilter === "Approved" ? "ring-2 ring-emerald-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Approved"
                            value={stats.cleared.toString()}
                            sub="Work Authorized"
                            accent="text-emerald-500" />
                    </div>
                    <div onClick={() => setActiveFilter("Pending/Reject")} className={`cursor-pointer group transition-all rounded-xl ${activeFilter === "Pending/Reject" ? "ring-2 ring-rose-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Pending/ Reject"
                            value={stats.pending.toString()}
                            sub="Awaiting Clearance"
                            accent="text-rose-500" />
                    </div>
                    <div onClick={() => setActiveFilter("Rate")} className={`cursor-pointer group transition-all rounded-xl ${activeFilter === "Rate" ? "ring-2 ring-blue-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Clearance Rate"
                            value={stats.clearanceRate}
                            sub="Avg Site Precision"
                            accent="text-blue-500" />
                    </div>
                </div>

                {/* ── Filter Bar & Table Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex flex-col">
                    <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center gap-4 bg-white font-inter">
                        <div className="relative w-full md:max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by activity, ID or remarks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter font-bold"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 font-inter">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Active Filter:</span>
                            <select
                                value={activeFilter}
                                onChange={(e) => setActiveFilter(e.target.value as any)}
                                className="bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-primary uppercase tracking-widest shadow-sm px-3 py-1 outline-none cursor-pointer"
                            >
                                <option value="Select">Select</option>
                                <option value="Approved">Approved</option>
                                <option value="Pending">Pending</option>
                                <option value="Reject">Reject</option>
                            </select>

                            {/* Sort Filter */}
                            <div className="relative flex items-center">
                                <div className="absolute left-3 text-slate-400 pointer-events-none">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                                    className="appearance-none bg-white border border-primary rounded-full text-sm font-bold text-primary shadow-sm pl-9 pr-8 py-1.5 outline-none cursor-pointer"
                                >
                                    <option value="latest">Latest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                                <div className="absolute right-3 text-slate-400 pointer-events-none">
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        <table className="w-full text-left font-inter min-w-[1000px]">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                    <th className="px-6 py-4">Work Authorization</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Remarks</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-inter">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center font-inter">
                                            <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing Authorizations...</p>
                                        </td>
                                    </tr>
                                ) : paginatedApprovals.length > 0 ? (
                                    paginatedApprovals.map((approval) => (
                                        <tr key={approval.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col font-inter">
                                                    <span className="text-sm font-bold text-slate-800 uppercase font-inter">{approval.entity_type}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-inter">Auth Log</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${getStatusStyle(approval.status)} font-inter`}>
                                                    {approval.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[10px] font-bold text-slate-400 truncate max-w-[250px] font-inter">
                                                    {approval.remarks || "No technical narrative narrated"}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 font-inter">
                                                    <button
                                                        onClick={() => setSelectedApproval(approval)}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
                                                        title="View Details"
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
                                        <td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-inter">
                                            No authorization requests discovered in the project vault.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Pagination Controls ──────────────────────────── */}
                    {!loading && filteredApprovals.length > 0 && (
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl">
                            {/* Left: Items per page */}
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                                <select 
                                    value={itemsPerPage} 
                                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-primary bg-white shadow-sm"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>

                            {/* Center: Showing info */}
                            <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredApprovals.length)} of {filteredApprovals.length} records
                            </div>

                            {/* Right: Pagination */}
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                
                                {(() => {
                                    const totalItems = filteredApprovals.length;
                                    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                                    const pages = [];
                                    if (totalPages <= 5) {
                                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                                    } else {
                                        if (currentPage <= 3) {
                                            pages.push(1, 2, 3, 4, '...', totalPages);
                                        } else if (currentPage >= totalPages - 2) {
                                            pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                                        } else {
                                            pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                                        }
                                    }

                                    return pages.map((page, index) => {
                                        if (page === '...') {
                                            return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
                                        }
                                        const pageNum = page as number;
                                        const isActive = currentPage === pageNum;
                                        return (
                                            <button
                                                key={`page-${pageNum}`}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${
                                                    isActive 
                                                        ? 'bg-primary text-white shadow-sm shadow-primary/20 border border-primary' 
                                                        : 'bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    });
                                })()}

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredApprovals.length / itemsPerPage), prev + 1))}
                                    disabled={currentPage === Math.max(1, Math.ceil(filteredApprovals.length / itemsPerPage)) || filteredApprovals.length === 0}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
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
                    <div className="p-6 font-inter">
                        {/* ── Profile Style Header ────────────────── */}
                        <div className={`${statusColors[selectedApproval.status as keyof typeof statusColors] || 'bg-primary'} rounded-2xl p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter`}>
                            <div className="relative z-10 flex items-center gap-6 font-inter text-white">
                                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 relative font-inter">
                                    <span className="text-4xl font-bold font-inter">{selectedApproval.entity_type.charAt(0).toUpperCase()}</span>
                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${selectedApproval.status === 'Approved' ? 'bg-emerald-400' : 'bg-amber-400'} border-4 border-white/20 rounded-full animate-pulse`} />
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-bold tracking-tight font-inter uppercase">{selectedApproval.entity_type} CLEARANCE</h3>
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${selectedApproval.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-100' : 'bg-amber-500/20 text-amber-100'}`}>
                                            {selectedApproval.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[10px] font-bold font-inter">approval.ref-{String(selectedApproval.id).toLowerCase()}@infrapilot.com</span>
                                    </div>
                                    <div className="px-3 py-1 bg-white/20 rounded-full inline-block font-inter">
                                        <span className="text-[10px] font-bold uppercase tracking-widest font-inter">ENTITY ID: {selectedApproval.entity_id}</span>
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
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-inter">Operational Intelligence</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Entity Category</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter uppercase">{selectedApproval.entity_type}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Entity Reference</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter">#LOG-{selectedApproval.entity_id}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Authorization Status</p>
                                        <p className={`text-sm font-bold font-inter ${selectedApproval.status === 'Approved' ? 'text-emerald-500' : 'text-amber-500'}`}>{selectedApproval.status.toUpperCase()}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">System Ref</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter">AUT-{selectedApproval.id}X</p>
                                    </div>
                                </div>
                            </div>

                            {/* Technical Narrative Section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Phone className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-inter">Technical Narrative</p>
                                </div>
                                <div className="grid grid-cols-1 gap-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Audit Trail & Remarks</p>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-inter">
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
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-inter">Audit Integrity</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Requested By</p>
                                        <p className="text-sm font-bold text-blue-600 font-inter">User {selectedApproval.requested_by}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">System Sync</p>
                                        <p className="text-sm font-bold text-emerald-500 font-inter">Verified Request</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedApproval(null)}
                            className={`w-full py-4 ${statusColors[selectedApproval.status as keyof typeof statusColors] || 'bg-primary'} text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 shadow-primary/20 font-inter`}
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
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">Authorization Identity</h3>
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
                                <input name="entity_id" type="number" min="0" value={formData.entity_id} onChange={handleInputChange} placeholder="e.g. 1" className={inputClasses(errors.entity_id)} />
                                {errors.entity_id && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1 font-inter">{errors.entity_id}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">Technical Narrative</h3>
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
