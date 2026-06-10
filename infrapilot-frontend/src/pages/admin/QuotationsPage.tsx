import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
    Zap
} from "lucide-react";
import SortDropdown from "../../components/common/SortDropdown";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import RejectReasonModal from "../../components/common/RejectReasonModal";
import { quotationService } from "../../services/quotationService";
import { financeService } from "../../services/financeService";
import type { Quotation } from "../../types/quotation";
import toast from "react-hot-toast";
import InvoicePreviewModal from "../../components/forms/InvoicePreviewModal";
import { formatCurrency, formatCompactCurrency } from "../../utils/currencyUtils";

const QuotationsPage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [quotations, setQuotations] = useState<Quotation[]>([]);
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

    // Preview state
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);
    const [isFetchingPreview, setIsFetchingPreview] = useState(false);

    const fetchQuotations = async () => {
        try {
            setIsLoading(true);
            const data = await quotationService.getQuotations();
            setQuotations(data);
        } catch (error) {
            toast.error("Failed to fetch quotations");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotations();
    }, []);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await quotationService.deleteQuotation(deleteTarget);
            toast.success("Quotation deleted");
            fetchQuotations();
        } catch (error) {
            toast.error("Failed to delete quotation");
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
        }
    };

    const filteredQuotations = useMemo(() => {
        const filtered = quotations.filter(q => {
            const matchSearch = q.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.quotation_no?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchStatus = statusFilter === "all" ||
                q.status?.toLowerCase() === statusFilter.toLowerCase();
            return matchSearch && matchStatus;
        });
        return [...filtered].sort((a, b) => {
            const aDate = new Date(a.created_at || 0).getTime();
            const bDate = new Date(b.created_at || 0).getTime();
            return sortOrder === "latest" ? bDate - aDate : aDate - bDate;
        });
    }, [quotations, searchQuery, statusFilter, sortOrder]);

    const totalPages = Math.max(1, Math.ceil(filteredQuotations.length / PAGE_SIZE));
    const pagedQuotations = filteredQuotations.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

    // Reset to page 0 on search/filter changes
    useEffect(() => {
        setCurrentPage(0);
    }, [searchQuery, statusFilter]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Approved": return "bg-emerald-100 text-emerald-600";
            case "Pending": return "bg-amber-100 text-amber-600";
            case "Draft": return "bg-slate-100 text-slate-600";
            case "Declined": return "bg-rose-100 text-rose-600";
            default: return "bg-slate-100 text-slate-500";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Approved": return <CheckCircle className="w-3 h-3" />;
            case "Pending": return <Clock className="w-3 h-3" />;
            case "Draft": return <FileText className="w-3 h-3" />;
            case "Declined": return <XCircle className="w-3 h-3" />;
            default: return null;
        }
    };

    const totalValue = quotations.reduce((sum, q) => sum + (q.grand_total || 0), 0);
    const approvedCount = quotations.filter(q => q.status === "approved").length;
    const approvalRate = quotations.length > 0 ? Math.round((approvedCount / quotations.length) * 100) : 0;
    const pendingDrafts = quotations.filter(q => q.status === "draft" || q.status === "sent").length;

    const handleApprove = async (id: number) => {
        try {
            await quotationService.approveQuotation(id);
            toast.success("Quotation approved successfully");
            fetchQuotations();
        } catch (error) {
            toast.error("Failed to approve quotation");
        }
    };

    const handleConvertQuotation = async (quotationId: number) => {
        try {
            setIsLoading(true);
            await financeService.convertQuotationToInvoice(quotationId);
            toast.success("Converted to invoice successfully!");
            navigate("/admin/invoices/all?type=invoice");
        } catch (error: any) {
            toast.error(error.message || "Failed to convert quotation");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async (reason: string) => {
        if (!rejectTarget) return;
        setIsRejecting(true);
        try {
            await quotationService.rejectQuotation(rejectTarget, reason);
            toast.success("Quotation rejected");
            fetchQuotations();
        } catch (error) {
            toast.error("Failed to reject quotation");
        } finally {
            setIsRejecting(false);
            setRejectTarget(null);
        }
    };

    const handleDownload = async (id: number) => {
        try {
            setIsFetchingPreview(true);
            toast.loading("Preparing preview...", { id: "preview-loading" });
            const data = await quotationService.getQuotationPreview(id);

            // Map Quotation to InvoicePreview format
            const mappedData = {
                clientName: data.client_name,
                clientAddress: data.billing_address || data.site_address,
                clientGst: data.gst_number,
                invoiceNo: data.quotation_no || `QTN-${data.id}`,
                date: data.created_at ? new Date(data.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
                items: data.items || [],
                materialItems: data.material_items || [],
                labourItems: data.labour_items || [],
                extraChargeItems: data.extra_charge_items || [],
                subTotal: data.subtotal || 0,
                cgstRate: data.cgst_percent || 0,
                sgstRate: data.sgst_percent || 0,
                discount: data.discount_amount || 0,
                advancePaid: data.advance_paid || 0,
                balanceDue: data.balance_due || 0,
                grandTotal: data.grand_total || 0
            };

            setPreviewData(mappedData);
            setIsPreviewModalOpen(true);
            toast.success("Ready for print!", { id: "preview-loading" });
        } catch (error) {
            toast.error("Failed to load quotation preview", { id: "preview-loading" });
        } finally {
            setIsFetchingPreview(false);
        }
    };

    return (
        <>
            <Navbar title="Quotations / Estimates" breadcrumb={["Dashboard", "Invoices", "Quotations"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Client Quotations</h1>
                        <p className="text-slate-500 text-sm font-medium">Manage and track all project proposals and estimates.</p>
                    </div>
                    <button
                        onClick={() => navigate("/admin/invoices/create")} // Reusing create invoice for now as they are similar
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Create New Quotation
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
                                    <th className="px-6 py-4">Quotation ID</th>
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
                                                <span className="text-sm font-bold text-slate-800">{q.quotation_no || `QTN-${q.id}`}</span>
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
                                                    {(q.status === 'draft' || q.status === 'sent' || String(q.status) === 'pending' || !q.is_approved) && (
                                                        <>
                                                            <button
                                                                onClick={() => q.id && handleApprove(q.id)}
                                                                title="Approve Quotation"
                                                                className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => q.id && setRejectTarget(q.id)}
                                                                title="Reject Quotation"
                                                                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {q.status?.toLowerCase() === 'approved' && (
                                                        <button
                                                            onClick={() => q.id && handleConvertQuotation(q.id)}
                                                            className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                                                            title="Convert to Invoice"
                                                        >
                                                            <Zap className="w-4 h-4 text-emerald-500" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => navigate(`/admin/quotations/view/${q.id}`)}
                                                        className="p-2 text-slate-400 hover:text-primary transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => q.id && handleDownload(q.id)}
                                                        disabled={isFetchingPreview}
                                                        className="p-2 text-slate-400 hover:text-emerald-500 transition-colors hidden md:block disabled:opacity-50"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => q.id && setDeleteTarget(q.id)}
                                                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
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
                            Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filteredQuotations.length)} of {filteredQuotations.length} Quotations
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
            <InvoicePreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                data={previewData}
            />
        </>
    );
};

export default QuotationsPage;
