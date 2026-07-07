import React, { useState, useMemo, useEffect, useCallback } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";
import {
    Search,
    Plus,
    Eye,
    Loader2,
    Check,
    X,
    RotateCcw,
    FileText,
    Box
    ,
    ChevronLeft,
    ChevronRight,
    Clock,
    ChevronDown
} from "lucide-react";
import { siteRequestService } from "../../../services/siteRequestService";
import { projectService } from "../../../services/projectService";
import type { CreateSiteRequest } from "../../../services/siteRequestService";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface MaterialRequestRecord {
    id: string | number;
    project_id?: string | number;
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
    const [projectId, setProjectId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentUserName, setCurrentUserName] = useState("Site Engineer");
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [activeFilter, setActiveFilter] = useState<"Select" | "Approved" | "Pending" | "Reject">("Select");
    const [resourceTypeFilter, setResourceTypeFilter] = useState<"All" | "Material" | "Equipment" | "Labour">("All");
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

    const [formData, setFormData] = useState({
        project_id: "" as string | number,
        request_type: "Material",
        description: "",
        quantity: "" as string | number
    });

    useEffect(() => {
        const userStr = localStorage.getItem("infrapilot_user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const pId = user?.project_id || user?.user?.project_id;

                setCurrentUserName(user?.name || user?.user?.name || "Engineer");
                setCurrentUserId(Number(user?.id || user?.user?.id || 36));

                if (pId) {
                    setProjectId(Number(pId));
                } else {
                    setProjectId(92);
                }
            } catch (e) {
                console.error("Failed to resolve user data", e);
                setProjectId(92);
            }
        } else {
            setProjectId(92);
        }
    }, []);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await projectService.getProjects(100, 0);
                const list = Array.isArray(res) ? res : (res.items || res.data || []);
                setProjects(list);
            } catch (error) {
                console.error("Failed to fetch projects", error);
            }
        };
        fetchProjects();
    }, []);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const fetchRequests = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            const results = await siteRequestService.getRequests(projectId);
            const combinedData = Array.isArray(results) ? results : (results as any).items || [];
            const sortedData = combinedData.sort((a: any, b: any) => Number(b.id) - Number(a.id));
            setRequestData(sortedData);
        } catch (error) {
            console.error("Failed to fetch requests:", error);
            toast.error("Failed to fetch requisition list.");
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
        if (!formData.project_id) newErrors.project_id = "Project ID is required";
        if (!formData.request_type) newErrors.request_type = "Request type is required";
        if (!formData.description.trim()) newErrors.description = "Technical narrative is required";
        if (!formData.quantity || Number(formData.quantity) <= 0) newErrors.quantity = "Valid numeric quantity is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        const toastId = toast.loading("Syncing with Procurement API...");
        try {
            const payload: CreateSiteRequest = {
                project_id: Number(formData.project_id),
                request_type: formData.request_type,
                description: formData.description,
                quantity: Number(formData.quantity)
            };

            const newRecord = await siteRequestService.createRequest(payload);
            toast.success("Requisition Created Successfully!", { id: toastId });

            // Only add to the list if the request was created for the current globally selected project
            if (projectId === payload.project_id) {
                setRequestData(prev => [{ ...newRecord, requested_by: currentUserId || 36 }, ...prev]);
            }
            setIsFormModalOpen(false);
        } catch (error) {
            console.error("Submission Error:", error);
            toast.error("Failed to commit requisition. Please try again.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resolveUserName = (id: string | number | null) => {
        if (!id) return null;
        if (Number(id) === 1) return "Admin";
        // Fallback to the current user's name for any other ID since this is the engineer's dashboard
        return currentUserName !== "Engineer" ? currentUserName : "Site Engineer";
    };

    const handleApprove = async (id: string | number) => {
        const toastId = toast.loading("Approving requisition...");
        try {
            await siteRequestService.approveRequest(id);
            toast.success("Requisition Approved!", { id: toastId });

            // Update local state immediately for real-time UI feedback
            setRequestData(prev => prev.map(req =>
                req.id === id ? { ...req, status: "Approved" as const } : req
            ));
        } catch (error) {
            toast.error("Failed to approve requisition", { id: toastId });
        }
    };

    const handleReject = async (id: string | number) => {
        const toastId = toast.loading("Rejecting requisition...");
        try {
            await siteRequestService.rejectRequest(id);
            toast.success("Requisition Rejected", { id: toastId });

            // Update local state immediately for real-time UI feedback
            setRequestData(prev => prev.map(req =>
                req.id === id ? { ...req, status: "Rejected" as const } : req
            ));
        } catch (error) {
            toast.error("Failed to reject requisition", { id: toastId });
        }
    };

    const [selectedRequest, setSelectedRequest] = useState<MaterialRequestRecord | null>(null);

    const baseFilteredRequests = useMemo(() => {
        if (!searchTerm.trim()) return requestData;
        return requestData.filter(r =>
            (r.request_type && r.request_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (r.id && String(r.id).toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [requestData, searchTerm]);

    const filteredRequests = useMemo(() => {
        let data = [...baseFilteredRequests];

        // Apply Status Filter
        if (activeFilter === "Approved") {
            data = data.filter(r => r.status === "Approved");
        } else if (activeFilter === "Pending") {
            data = data.filter(r => r.status === "Pending");
        } else if (activeFilter === "Reject") {
            data = data.filter(r => r.status === "Rejected");
        }

        // Apply Resource Type Filter
        if (resourceTypeFilter !== "All") {
            data = data.filter(r => r.request_type && r.request_type.toLowerCase() === resourceTypeFilter.toLowerCase());
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
    }, [baseFilteredRequests, activeFilter, resourceTypeFilter, sortOrder]);

    const paginatedRequests = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredRequests, currentPage, itemsPerPage]);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeFilter, resourceTypeFilter]);

    const stats = {
        total: baseFilteredRequests.length,
        approved: baseFilteredRequests.filter(r => r.status === "Approved").length,
        pending: baseFilteredRequests.filter(r => r.status === "Pending").length,
        fulfillment: Math.round((baseFilteredRequests.filter(r => r.status === "Approved").length / (baseFilteredRequests.length || 1)) * 100) || 0
    };

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";
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
            <Navbar title="Resources Requests" breadcrumb={["Engineer", "Approvals", "Material Requisition"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Resources Request
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Formal procurement requests for structural and consumable site resources.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={fetchRequests}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all"
                            title="Refetch Intelligence"
                        >
                            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            onClick={() => {
                                setFormData({
                                    project_id: "",
                                    request_type: "Material",
                                    description: "",
                                    quantity: ""
                                });
                                setErrors({});
                                setIsFormModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            New Entry
                        </button>
                    </div>
                </div>

                {/* ── Interactive Stats ────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        {
                            title: "Total Logs",
                            value: stats.total.toString(),
                            sub: "All Requests",
                            accent: "text-slate-800",
                            status: "Select",
                        },
                        {
                            title: "Approved",
                            value: stats.approved.toString(),
                            sub: "Released for Site",
                            accent: "text-emerald-500",
                            status: "Approved",
                        },
                        {
                            title: "Pending Review",
                            value: stats.pending.toString(),
                            sub: "PM Validation",
                            accent: "text-amber-500",
                            status: "Pending",
                        },
                        {
                            title: "Fulfillment",
                            value: `${stats.fulfillment}%`,
                            sub: "Procurement Yield",
                            accent: "text-blue-500",
                            status: null,
                        },
                    ].map((s) => (
                        <div
                            key={s.title}
                            onClick={() => s.status && setActiveFilter(s.status as any)}
                            className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all ${s.status ? 'hover:shadow-md cursor-pointer active:scale-95 hover:border-primary/20' : 'cursor-default'} group`}
                        >
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-primary transition-colors">
                                {s.title}
                            </p>
                            <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                            {s.sub && (
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                                    {s.sub}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* â”€â”€ Registry Container â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
                    <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-white font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by material type or requisition ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
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

                            {/* Resource Type Filter */}
                            <select
                                value={resourceTypeFilter}
                                onChange={(e) => setResourceTypeFilter(e.target.value as any)}
                                className="bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-primary uppercase tracking-widest shadow-sm px-3 py-1 outline-none cursor-pointer"
                            >
                                <option value="All">All Resources</option>
                                <option value="Material">Material</option>
                                <option value="Equipment">Equipment</option>
                                <option value="Labour">Labour</option>
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

                    <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        <table className="w-full text-left font-inter min-w-[1200px]">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                    <th className="px-6 py-4 font-inter">Resource Requisition</th>
                                    <th className="px-6 py-4 font-inter">Operational Status</th>
                                    <th className="px-6 py-4 font-inter">Volume / Quantity</th>
                                    <th className="px-6 py-4 text-right font-inter">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-inter">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center font-inter">
                                            <div className="flex flex-col items-center gap-3 font-inter">
                                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">Syncing requisition intelligence...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedRequests.length > 0 ? (
                                    paginatedRequests.map((request) => (
                                        <tr key={request.id} className="hover:bg-slate-50/50 transition-colors group font-inter border-b border-slate-50/50">
                                            <td className="px-6 py-4 font-inter">
                                                <div className="flex flex-col font-inter">
                                                    <span className="text-sm font-bold text-slate-800 font-inter uppercase tracking-tight">{request.request_type}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold font-inter truncate max-w-[200px] uppercase tracking-tight">
                                                        {request.description}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-inter">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border font-inter shadow-sm ${getStatusStyle(request.status)}`}>
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-inter">
                                                <div className="flex items-center gap-2 font-inter">
                                                    <div className="p-1.5 bg-blue-50 rounded-lg shrink-0">
                                                        <Box className="w-3 h-3 text-blue-500" />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-800 tabular-nums font-inter">{request.quantity} Units</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-inter">
                                                <div className="flex items-center justify-end gap-2 font-inter">
                                                    <button
                                                        onClick={() => setSelectedRequest(request)}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
                                                        title="View Details"
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
                                        <td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter">
                                            No procurement requisitions discovered in the project vault.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Pagination Controls ──────────────────────────── */}
                    {!isLoading && filteredRequests.length > 0 && (
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
                                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} records
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
                                    const totalItems = filteredRequests.length;
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
                                                className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${isActive
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
                                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredRequests.length / itemsPerPage), prev + 1))}
                                    disabled={currentPage === Math.max(1, Math.ceil(filteredRequests.length / itemsPerPage)) || filteredRequests.length === 0}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </PageTransition>

            {/* â”€â”€ Detail Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <Modal
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
                title="Requisition Intelligence Analysis"
                maxWidth="max-w-xl"
            >
                {selectedRequest && (
                    <div className="p-6 font-inter">
                        <div className={`rounded-2xl p-10 mb-8 text-white shadow-2xl relative overflow-hidden font-inter ${selectedRequest.status === 'Approved' ? 'bg-emerald-600' : selectedRequest.status === 'Pending' ? 'bg-amber-600' : 'bg-rose-600'}`}>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="relative z-10 font-inter">
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60 mb-3 font-inter">Procurement Artifact Record</p>
                                <h3 className="text-2xl font-bold tracking-tight leading-tight mb-8 font-inter">{selectedRequest.request_type}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-inter">
                                    <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-5 border border-white/10 font-inter">
                                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1.5 font-inter">Operational Status</p>
                                        <p className="text-xl font-bold font-inter tracking-widest">{selectedRequest.status.toUpperCase()}</p>
                                    </div>
                                    <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-5 border border-white/10 font-inter">
                                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1.5 font-inter">Quantum Required</p>
                                        <p className="text-xl font-bold font-inter">{selectedRequest.quantity} UNITS</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            <div className="font-inter">
                                <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-3')}>Requirement Narrative</p>
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-[13px] font-bold text-slate-600 leading-relaxed font-inter uppercase tracking-tight shadow-inner">
                                    "{selectedRequest.description}"
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 font-inter">
                                <div className="font-inter">
                                    <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-1.5')}>Originating Engineer</p>
                                    <p className="text-sm font-bold text-slate-800 font-inter uppercase tracking-widest">{resolveUserName(selectedRequest.requested_by) || "SYST"}</p>
                                </div>
                                <div className="font-inter">
                                    <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-1.5')}>Approving Authority</p>
                                    <p className="text-sm font-bold text-blue-600 font-inter uppercase tracking-widest">{resolveUserName(selectedRequest.approved_by) || "Pending Review"}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedRequest(null)}
                            className={`w-full py-5 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.4em] transition-all shadow-2xl active:scale-95 font-inter mb-2 ${selectedRequest.status === 'Approved' ? 'bg-emerald-600 shadow-emerald-600/30 hover:bg-emerald-700' :
                                selectedRequest.status === 'Pending' ? 'bg-amber-600 shadow-amber-600/30 hover:bg-amber-700' :
                                    'bg-rose-600 shadow-rose-600/30 hover:bg-rose-700'
                                }`}
                        >
                            Dismiss Artifact Analysis
                        </button>
                    </div>
                )}
            </Modal>

            {/* â”€â”€ Form Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                            className="flex-[2] py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 font-inter"
                        >
                            {isSubmitting ? "Syncing..." : "Commit Requisition"}
                        </button>
                    </div>
                }
            >
                <form id="request-form" onSubmit={handleSubmit} className="p-6 space-y-8 font-inter">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
                            <Box className="w-4 h-4 text-primary" />
                            Requisition Core Identity
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
                            <div className="font-inter">
                                <label className={labelClasses}>Project <span className="text-rose-500">*</span></label>
                                <select
                                    name="project_id"
                                    value={formData.project_id}
                                    onChange={handleInputChange}
                                    className={inputClasses(errors.project_id)}
                                >
                                    <option value="">-- Select Project --</option>
                                    {projects.map((p: any) => (
                                        <option key={p.id || p.project_id} value={p.id || p.project_id}>
                                            {p.name || p.project_name || `Project #${p.id || p.project_id}`}
                                        </option>
                                    ))}
                                </select>
                                {errors.project_id && <p className="mt-1.5 text-[9px] text-rose-500 font-black uppercase tracking-widest ml-1 font-inter">{errors.project_id}</p>}
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Resource Classification <span className="text-rose-500">*</span></label>
                                <select
                                    name="request_type"
                                    value={formData.request_type}
                                    onChange={handleInputChange}
                                    className={inputClasses(errors.request_type)}
                                >
                                    <option value="Material">Material</option>
                                    <option value="Equipment">Equipment</option>
                                    <option value="Labour">Labour</option>
                                </select>
                                {errors.request_type && <p className="mt-1.5 text-[9px] text-rose-500 font-black uppercase tracking-widest ml-1 font-inter">{errors.request_type}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
                            <FileText className="w-4 h-4 text-primary" />
                            Technical Specifications Narrative
                        </h3>
                        <div className="font-inter space-y-6">
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
                            <div className="font-inter">
                                <label className={labelClasses}>Required Quantum (Units) <span className="text-rose-500">*</span></label>
                                <input
                                    name="quantity"
                                    type="number"
                                    min="0"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 150"
                                    className={inputClasses(errors.quantity)}
                                />
                                {errors.quantity && <p className="mt-1.5 text-[9px] text-rose-500 font-black uppercase tracking-widest ml-1 font-inter">{errors.quantity}</p>}
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default MaterialRequestPage;
