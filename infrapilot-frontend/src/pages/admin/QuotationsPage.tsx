import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    FileText,
    Plus,
    Search,
    Eye,
    Trash2,
    CheckCircle,
    Clock,
    XCircle,
    Download,
    Zap,
    Send,
    ChevronDown,
    Layers
} from "lucide-react";
import SortDropdown from "../../components/common/SortDropdown";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import RejectReasonModal from "../../components/common/RejectReasonModal";
// Removed unused PDFPreviewModal import
import { quotationService } from "../../services/quotationService";
import { financeService } from "../../services/financeService";
import type { Quotation } from "../../types/quotation";
import toast from "react-hot-toast";
import { formatCurrency, formatCompactCurrency } from "../../utils/currencyUtils";

const QuotationsPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState("");
    const initialTab = useMemo<"quotations" | "dummy_quotations">(() => {
        const tabParam = searchParams.get("tab");
        if (tabParam === "dummy_quotations" || tabParam === "draft" || tabParam === "draft_quotations") {
            return "dummy_quotations";
        }
        const sessionTab = sessionStorage.getItem("admin_quotations_active_tab");
        if (sessionTab === "dummy_quotations") {
            return "dummy_quotations";
        }
        return "quotations";
    }, [searchParams]);
    const [activeTab, setActiveTab] = useState<"quotations" | "dummy_quotations">(initialTab);
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [dummyQuotations, setDummyQuotations] = useState<Quotation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(0);
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
    const PAGE_SIZE = 10;

    // Modal state
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [rejectTarget, setRejectTarget] = useState<number | null>(null);
    const [isRejecting, setIsRejecting] = useState(false);
    const [isFetchingPreview, setIsFetchingPreview] = useState(false);

    // Preview state removed as it is handled by navigation to view page instead of modal

    // Create Dropdown state
    const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);

    const fetchQuotations = async () => {
        try {
            setIsLoading(true);
            const [data, dummyData] = await Promise.all([
                quotationService.getQuotations(),
                quotationService.getDummyQuotations()
            ]);
            setQuotations(data);
            setDummyQuotations(dummyData);
        } catch (error) {
            toast.error("Failed to fetch quotations");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotations();
    }, []);

    useEffect(() => {
        const tabParam = searchParams.get("tab");
        if (tabParam === "dummy_quotations" || tabParam === "draft" || tabParam === "draft_quotations") {
            setActiveTab("dummy_quotations");
            sessionStorage.setItem("admin_quotations_active_tab", "dummy_quotations");
        } else if (tabParam === "quotations") {
            setActiveTab("quotations");
            sessionStorage.setItem("admin_quotations_active_tab", "quotations");
        }
    }, [searchParams]);

    const handleDelete = async () => {
        if (!deleteTarget) return;

        const target = (activeTab === "dummy_quotations" ? dummyQuotations : quotations).find(q => q.id === deleteTarget);
        const targetStatus = target?.status?.toLowerCase();
        if (targetStatus === "approved") {
            toast.error("Approved quotations cannot be deleted.");
            setDeleteTarget(null);
            return;
        }
        if (targetStatus === "converted") {
            toast.error("Converted quotations cannot be deleted.");
            setDeleteTarget(null);
            return;
        }

        setIsDeleting(true);
        try {
            if (activeTab === "dummy_quotations") {
                await quotationService.deleteDummyQuotation(deleteTarget);
            } else {
                await quotationService.deleteQuotation(deleteTarget);
            }
            toast.success("Quotation deleted");
            fetchQuotations();
        } catch (error: any) {
            const detail = error.response?.data?.detail || error.response?.data?.message || error.message;
            toast.error(typeof detail === "string" ? detail : "Failed to delete quotation");
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
        }
    };

    const filteredQuotations = useMemo(() => {
        const sourceData = activeTab === "dummy_quotations" ? dummyQuotations : quotations;
        const term = searchQuery.toLowerCase().trim();
        const filtered = sourceData.filter(q => {
            const rawId = String(q.id || "").toLowerCase();
            const qtnId = `qtn-${q.id}`.toLowerCase();
            const formattedId = q.id ? `qt/2026/${String(q.id).padStart(4, "0")}`.toLowerCase() : "";
            const matchSearch = !term ||
                (q.client_name || "").toLowerCase().includes(term) ||
                (q.project_name || "").toLowerCase().includes(term) ||
                (q.quotation_no || "").toLowerCase().includes(term) ||
                rawId === term || rawId.includes(term) ||
                qtnId.includes(term) ||
                formattedId.includes(term);
            const matchStatus = statusFilter === "all" ||
                q.status?.toLowerCase() === statusFilter.toLowerCase();
            return matchSearch && matchStatus;
        });
        return [...filtered].sort((a, b) => {
            const aDate = new Date(a.created_at || 0).getTime();
            const bDate = new Date(b.created_at || 0).getTime();
            return sortOrder === "latest" ? bDate - aDate : aDate - bDate;
        });
    }, [quotations, dummyQuotations, activeTab, searchQuery, statusFilter, sortOrder]);

    const displayData = filteredQuotations;
    const totalPages = Math.max(1, Math.ceil(displayData.length / PAGE_SIZE));
    const pagedQuotations = displayData.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

    // Reset to page 0 on search/filter changes
    useEffect(() => {
        setCurrentPage(0);
    }, [searchQuery, statusFilter, activeTab]);

    const getStatusColor = (status: string) => {
        const s = (status || "").toLowerCase();
        switch (s) {
            case "approved": return "bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold";
            case "pending": return "bg-amber-100 text-amber-700 border border-amber-300 font-bold";
            case "draft": return "bg-slate-100 text-slate-700 border border-slate-300 font-bold";
            case "declined":
            case "rejected":
            case "cancelled": return "bg-rose-100 text-rose-700 border border-rose-300 font-bold";
            case "converted": return "bg-blue-100 text-blue-700 border border-blue-300 font-bold";
            default: return "bg-slate-100 text-slate-600 border border-slate-200 font-bold";
        }
    };

    const getStatusIcon = (status: string) => {
        const s = (status || "").toLowerCase();
        switch (s) {
            case "approved": return <CheckCircle className="w-3 h-3 text-emerald-600" />;
            case "pending": return <Clock className="w-3 h-3 text-amber-600" />;
            case "draft": return <FileText className="w-3 h-3 text-slate-500" />;
            case "declined":
            case "rejected":
            case "cancelled": return <XCircle className="w-3 h-3 text-rose-600" />;
            case "converted": return <Zap className="w-3 h-3 text-blue-600" />;
            default: return null;
        }
    };

    const totalValue = quotations.reduce((sum, q) => sum + (q.grand_total || 0), 0);
    const approvedCount = quotations.filter(q => q.status === "approved").length;
    const approvalRate = quotations.length > 0 ? Math.round((approvedCount / quotations.length) * 100) : 0;
    const pendingDrafts = quotations.filter(q => {
        const s = (q.status || "").toLowerCase();
        return s === "draft" || s === "pending";
    }).length;

    const handleApprove = async (id: number) => {
        const target = quotations.find(q => q.id === id) || dummyQuotations.find(q => q.id === id);
        const status = target?.status?.toLowerCase();
        if (status === "rejected" || status === "declined" || status === "cancelled") {
            toast.error("Cannot approve a rejected quotation.");
            return;
        }
        try {
            await quotationService.approveQuotation(id);
            toast.success("Quotation approved successfully");
            fetchQuotations();
        } catch (error: any) {
            const errorMsg = error?.response?.data?.detail || error?.response?.data?.message || "";
            if (typeof errorMsg === "string" && (errorMsg.toLowerCase().includes("reject") || errorMsg.toLowerCase().includes("cannot approve"))) {
                toast.error("Cannot approve a rejected quotation.");
            } else {
                toast.error(errorMsg || "Failed to approve quotation");
            }
        }
    };

    const handleConvertQuotation = async (quotationId: number) => {
        try {
            setIsLoading(true);
            await financeService.convertQuotationToInvoice(quotationId);
            toast.success("Converted to invoice successfully!");
            navigate("/admin/invoices/all?type=invoice");
        } catch (error: any) {
            let msg = "Failed to convert quotation";
            if (error.response?.data?.detail) {
                msg = typeof error.response.data.detail === 'string' ? error.response.data.detail : JSON.stringify(error.response.data.detail);
            } else if (error.response?.data?.message) {
                msg = error.response.data.message;
            } else if (error.message) {
                msg = error.message;
            }
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async (reason: string) => {
        if (!rejectTarget) return;
        const trimmed = (reason || "").trim();
        if (trimmed.length < 3) {
            toast.error("Reason must be at least 3 characters long.");
            return;
        }
        setIsRejecting(true);
        try {
            if (activeTab === "dummy_quotations") {
                await quotationService.rejectDraftQuotation(rejectTarget, trimmed);
            } else {
                await quotationService.rejectQuotation(rejectTarget, trimmed);
            }
            toast.success("Quotation rejected successfully");
            fetchQuotations();
        } catch (error: any) {
            let msg = "Failed to reject quotation";
            const detail = error?.response?.data?.detail;
            if (Array.isArray(detail) && detail[0]?.msg) {
                msg = detail[0].msg;
            } else if (typeof detail === "string") {
                msg = detail;
            } else if (error?.response?.data?.message) {
                msg = error.response.data.message;
            }
            toast.error(msg);
        } finally {
            setIsRejecting(false);
            setRejectTarget(null);
        }
    };

    const handleSendQuotation = async (id: number) => {
        const toastId = toast.loading("Sending quotation...");
        try {
            await quotationService.sendQuotation(id);
            toast.success("Quotation sent successfully", { id: toastId });
            fetchQuotations();
        } catch (error: any) {
            let msg = "Failed to send quotation";
            if (error.response?.data?.detail) {
                msg = typeof error.response.data.detail === 'string' ? error.response.data.detail : JSON.stringify(error.response.data.detail);
            } else if (error.response?.data?.message) {
                msg = error.response.data.message;
            } else if (error.message) {
                msg = error.message;
            }
            toast.error(msg, { id: toastId });
        }
    };

    const handlePreviewPDF = async (id: number) => {
        try {
            setIsFetchingPreview(true);
            const toastId = toast.loading("Downloading PDF...");

            const isDummy = activeTab === "dummy_quotations";
            const sourceList = isDummy ? dummyQuotations : quotations;
            const q = sourceList.find(item => item.id === id);
            const quotationNo = q?.quotation_no || `QTN-${id}`;

            let blob;
            if (isDummy) {
                blob = await quotationService.downloadDummyQuotationPDF(id);
            } else {
                blob = await quotationService.downloadQuotationPDF(id);
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Quotation_${quotationNo}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success("Download complete!", { id: toastId });
        } catch (error) {
            toast.error("Failed to download PDF", { id: "preview-loading" });
        } finally {
            setIsFetchingPreview(false);
        }
    };



    return (
        <>
            <Navbar title="Quotations / Estimates" breadcrumb={["Dashboard", { label: "Invoices", path: "/admin/invoices/all" }, "Quotations"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Client Quotations</h1>
                        <p className="text-slate-500 text-sm font-medium">Manage and track all project proposals and estimates.</p>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5" /> Create New Quotation <ChevronDown className={`w-4 h-4 transition-transform ${isCreateDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isCreateDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsCreateDropdownOpen(false)} />
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-20 py-2">
                                    <button
                                        onClick={() => {
                                            setIsCreateDropdownOpen(false);
                                            sessionStorage.setItem("admin_quotations_active_tab", "dummy_quotations");
                                            navigate("/admin/quotations/draft/new");
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex flex-col gap-0.5"
                                    >
                                        <span className="text-sm font-bold text-slate-800">Draft Quotation</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client & Items Only</span>
                                    </button>
                                    <div className="border-t border-slate-50 my-1" />
                                    <button
                                        onClick={() => {
                                            setIsCreateDropdownOpen(false);
                                            navigate("/admin/invoices/create");
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex flex-col gap-0.5"
                                    >
                                        <span className="text-sm font-bold text-slate-800">Standard Quotation</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Detailed Editor</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* TABS */}
                <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm w-fit mb-6">
                    <button
                        onClick={() => {
                            setActiveTab("quotations");
                            setCurrentPage(0);
                            setSearchQuery("");
                            setStatusFilter("all");
                            sessionStorage.setItem("admin_quotations_active_tab", "quotations");
                            setSearchParams({});
                        }}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "quotations"
                            ? "bg-primary text-white shadow-md shadow-primary/20"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                            }`}
                    >
                        <FileText className="w-4 h-4" />
                        Quotations
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${activeTab === "quotations" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{quotations.length}</span>
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("dummy_quotations");
                            setCurrentPage(0);
                            setSearchQuery("");
                            setStatusFilter("all");
                            sessionStorage.setItem("admin_quotations_active_tab", "dummy_quotations");
                            setSearchParams({ tab: "dummy_quotations" });
                        }}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "dummy_quotations"
                            ? "bg-primary text-white shadow-md shadow-primary/20"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                            }`}
                    >
                        <Layers className="w-4 h-4" />
                        Draft Quotation
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${activeTab === "dummy_quotations" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{dummyQuotations.length}</span>
                    </button>
                </div>

                {/* Quick Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        title="Total Pipeline Value"
                        value={formatCompactCurrency(totalValue)}
                        sub={`${quotations.length} Active Quotations`}
                        accent="text-primary"
                    />
                    <StatCard
                        title="Win / Approval Rate"
                        value={`${approvalRate}%`}
                        sub="Based on all time"
                        accent="text-emerald-500"
                    />
                    <StatCard
                        title="Pending Drafts"
                        value={pendingDrafts.toString()}
                        sub="Requires admin review"
                        accent="text-amber-500"
                    />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by ID, Client or Project..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                            >
                                <option value="all">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="approved">Approved</option>
                                <option value="declined">Declined</option>
                                <option value="converted">Converted</option>
                            </select>
                            <SortDropdown value={sortOrder} onChange={setSortOrder} />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                                    <th className="px-6 py-4">{activeTab === 'dummy_quotations' ? "Quotation ID" : "Quotation No"}</th>
                                    <th className="px-6 py-4">Client / Project</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Quotations...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredQuotations.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">
                                            No quotations found
                                        </td>
                                    </tr>
                                ) : (
                                    pagedQuotations.map((q) => (
                                        <tr key={q.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-slate-800">
                                                    {activeTab === 'dummy_quotations'
                                                        ? (q.quotation_no || `QTN-${q.id}`)
                                                        : (q.quotation_no || (q.id ? `QT/2026/${String(q.id).padStart(4, "0")}` : "-"))}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-bold text-slate-700">{q.client_name}</p>
                                                    <p className="text-xs text-slate-400">{q.project_name}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-semibold text-slate-500">
                                                    {q.created_at ? new Date(q.created_at).toLocaleDateString() : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-black text-slate-700">{formatCurrency(q.grand_total || 0)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${getStatusColor(q.status || "draft")}`}>
                                                    {getStatusIcon(q.status || "draft")}
                                                    {q.status || "draft"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {activeTab !== 'dummy_quotations' && (() => {
                                                        const isRejected = q.status?.toLowerCase() === 'rejected' || q.status?.toLowerCase() === 'declined' || q.status?.toLowerCase() === 'cancelled';
                                                        const isApproved = q.status?.toLowerCase() === 'approved';
                                                        const isConverted = q.status?.toLowerCase() === 'converted';

                                                        if (isApproved || isConverted) return null;

                                                        return (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        if (isRejected) {
                                                                            toast.error("Cannot approve a rejected quotation. Please edit and update first.");
                                                                            return;
                                                                        }
                                                                        if (q.id) handleApprove(q.id);
                                                                    }}
                                                                    disabled={isRejected}
                                                                    title={isRejected ? "Cannot approve a rejected quotation. Please edit and update first." : "Approve Quotation"}
                                                                    className={`p-2 transition-colors ${
                                                                        isRejected
                                                                            ? "text-slate-300 opacity-40 cursor-not-allowed hover:text-slate-300"
                                                                            : "text-slate-400 hover:text-emerald-500"
                                                                    }`}
                                                                >
                                                                    <CheckCircle className="w-4 h-4" />
                                                                </button>
                                                                {!isRejected && (
                                                                    <button
                                                                        onClick={() => q.id && setRejectTarget(q.id)}
                                                                        title="Reject Quotation"
                                                                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                                                    >
                                                                        <XCircle className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                    {q.status?.toLowerCase() === 'approved' && (
                                                        <button
                                                            onClick={() => q.id && handleConvertQuotation(q.id)}
                                                            className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                                                            title="Convert to Invoice"
                                                        >
                                                            <Zap className="w-4 h-4 text-emerald-500" />
                                                        </button>
                                                    )}
                                                    {activeTab !== 'dummy_quotations' && (() => {
                                                        const isRejected = q.status?.toLowerCase() === 'rejected' || q.status?.toLowerCase() === 'declined' || q.status?.toLowerCase() === 'cancelled';
                                                        const isConverted = q.status?.toLowerCase() === 'converted';

                                                        if (isConverted) return null;

                                                        return (
                                                            <button
                                                                onClick={() => {
                                                                    if (isRejected) {
                                                                        toast.error("Cannot send a rejected quotation. Please edit and update first.");
                                                                        return;
                                                                    }
                                                                    if (q.id) handleSendQuotation(q.id);
                                                                }}
                                                                disabled={isRejected}
                                                                className={`p-2 transition-colors ${
                                                                    isRejected
                                                                        ? "text-slate-300 opacity-40 cursor-not-allowed hover:text-slate-300"
                                                                        : "text-slate-400 hover:text-blue-500"
                                                                }`}
                                                                title={isRejected ? "Cannot send a rejected quotation. Please edit and update first." : "Send Quotation"}
                                                            >
                                                                <Send className="w-4 h-4" />
                                                            </button>
                                                        );
                                                    })()}
                                                    <button
                                                        onClick={() => {
                                                            if (activeTab === 'dummy_quotations') {
                                                                sessionStorage.setItem("admin_quotations_active_tab", "dummy_quotations");
                                                                navigate(`/admin/quotations/draft/${q.id}`);
                                                            } else {
                                                                sessionStorage.setItem("admin_quotations_active_tab", "quotations");
                                                                navigate(`/admin/quotations/view/${q.id}`);
                                                            }
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-primary transition-colors"
                                                        title="View / Edit Quotation"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => q.id && handlePreviewPDF(q.id)}
                                                        disabled={isFetchingPreview}
                                                        className="p-2 text-slate-400 hover:text-emerald-500 transition-colors hidden md:block disabled:opacity-50"
                                                        title="Download PDF"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    {(() => {
                                                        const isApproved = q.status?.toLowerCase() === 'approved';
                                                        const isConverted = q.status?.toLowerCase() === 'converted';
                                                        const isProtected = isApproved || isConverted;
                                                        const deleteTitle = isApproved
                                                            ? "Approved quotations cannot be deleted"
                                                            : isConverted
                                                            ? "Converted quotations cannot be deleted"
                                                            : "Delete Quotation";

                                                        return (
                                                            <button
                                                                onClick={() => {
                                                                    if (isApproved) {
                                                                        toast.error("Approved quotations cannot be deleted.");
                                                                        return;
                                                                    }
                                                                    if (isConverted) {
                                                                        toast.error("Converted quotations cannot be deleted.");
                                                                        return;
                                                                    }
                                                                    if (q.id) setDeleteTarget(q.id);
                                                                }}
                                                                title={deleteTitle}
                                                                className={`p-2 transition-colors ${
                                                                    isProtected
                                                                        ? "text-slate-300 opacity-40 cursor-not-allowed hover:text-slate-300"
                                                                        : "text-slate-400 hover:text-rose-500"
                                                                }`}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, displayData.length)} of {displayData.length} Quotations
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
                                {currentPage + 1}
                            </div>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={currentPage >= totalPages - 1}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </PageTransition>

            {/* Modals */}
            <ConfirmationModal
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                isLoading={isDeleting}
                title="Delete Quotation"
                message="Are you sure you want to permanently delete this quotation? This action cannot be undone."
                confirmLabel="Delete"
                confirmClass="bg-rose-500 hover:bg-rose-600 shadow-rose-200"
            />
            <RejectReasonModal
                isOpen={rejectTarget !== null}
                onClose={() => setRejectTarget(null)}
                onConfirm={handleReject}
                isLoading={isRejecting}
                title="Reject Quotation"
            />

        </>
    );
};

export default QuotationsPage;
