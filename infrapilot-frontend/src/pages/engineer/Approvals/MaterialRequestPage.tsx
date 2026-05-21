import React, { useState, useMemo, useEffect, useCallback } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
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
    ChevronRight
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
    const [projects, setProjects] = useState<any[]>([]);
    const itemsPerPage = 20;

    // Interactive StatCard Filter
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Approved" | "Pending">("All");

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
                const pId = user?.project_id || user?.user?.project_id || user?.id;
                if (pId) setProjectId(Number(pId));
            } catch (e) {
                console.error("Failed to resolve project ID", e);
            }
        }
    }, []);

    const [selectedProjectFilter, setSelectedProjectFilter] = useState<number | "All">("All");

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
        setIsLoading(true);
        try {
            const serverData = await siteRequestService.getRequests(selectedProjectFilter);
            setRequestData(serverData);
        } catch (error) {
            toast.error("Failed to fetch requisition list.");
        } finally {
            setIsLoading(false);
        }
    }, [selectedProjectFilter]);

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

            // Switch to the project ID that was just used to submit the request
            if (projectId !== payload.project_id) {
                setProjectId(payload.project_id);
            } else {
                setRequestData(prev => [newRecord, ...prev]);
            }
            setIsFormModalOpen(false);
        } catch (error) {
            console.error("Submission Error:", error);
            toast.error("Failed to commit requisition. Please try again.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
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

            // Refetch the list from GET API
            await fetchRequests();
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

            // Refetch the list from GET API
            await fetchRequests();
        } catch (error) {
            toast.error("Failed to reject requisition", { id: toastId });
        }
    };

    const [selectedRequest, setSelectedRequest] = useState<MaterialRequestRecord | null>(null);

    const baseFilteredRequests = useMemo(() => {
        return requestData.filter(r =>
            r.request_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(r.id).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [requestData, searchTerm]);

    const filteredRequests = useMemo(() => {
        let data = baseFilteredRequests;

        // Apply StatCard Filter
        if (activeStatFilter === "Approved") {
            data = data.filter(r => r.status === "Approved");
        } else if (activeStatFilter === "Pending") {
            data = data.filter(r => r.status === "Pending");
        }

        return data;
    }, [baseFilteredRequests, activeStatFilter]);

    const paginatedRequests = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredRequests, currentPage]);

    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeStatFilter]);

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
            <Navbar title="Material Requests" breadcrumb={["Engineer", "Approvals", "Material Requisition"]} />

            <PageTransition className="p-4 md:p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter flex flex-col">
                {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8 font-inter">
                    <div className="font-inter">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">Procurement Requisition Ledger</h1>
                        <p className="text-slate-500 text-sm font-inter">Formal procurement requests for structural and consumable site resources.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setFormData({
                                    project_id: projectId ? String(projectId) : "1",
                                    request_type: "Material",
                                    description: "",
                                    quantity: ""
                                });
                                setErrors({});
                                setIsFormModalOpen(true);
                            }}
                            className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
                        >
                            <Plus className="w-4 h-4" />
                            Log Requisition
                        </button>
                        <button
                            onClick={fetchRequests}
                            className="p-2 text-slate-400 hover:text-primary transition-colors bg-white rounded-xl border border-slate-200 shadow-sm font-inter active:scale-95"
                            title="Refetch Intelligence"
                        >
                            <RotateCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* â”€â”€ Interactive Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                {/* â”€â”€ Scrollable Content Area â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8 font-inter">
                    <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Total Logs"
                            value={stats.total.toString()}
                            sub="All Requests"
                            accent="text-slate-800" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Approved")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Approved" ? "ring-2 ring-emerald-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Approved"
                            value={stats.approved.toString()}
                            sub="Released for Site"
                            accent="text-emerald-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Pending")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Pending" ? "ring-2 ring-amber-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Pending Review"
                            value={stats.pending.toString()}
                            sub="PM Validation"
                            accent="text-amber-500" />
                    </div>
                    <div className="cursor-default group transition-all rounded-xl hover:scale-[1.01]">
                        <StatCard
                            title="Fulfillment"
                            value={`${stats.fulfillment}%`}
                            sub="Procurement Yield"
                            accent="text-blue-500" />
                    </div>
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
                        <div className="flex items-center gap-3 font-inter">
                            <select
                                value={selectedProjectFilter}
                                onChange={(e) => setSelectedProjectFilter(e.target.value === "All" ? "All" : Number(e.target.value))}
                                className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer shadow-sm font-inter"
                            >
                                <option value="All">All Projects</option>
                                {projects.map((p: any) => (
                                    <option key={`filter-${p.id || p.project_id}`} value={p.id || p.project_id}>
                                        {p.name || p.project_name || `Project #${p.id || p.project_id}`}
                                    </option>
                                ))}
                            </select>
                            {activeStatFilter !== "All" && (
                                <button onClick={() => setActiveStatFilter("All")} className="p-2 text-slate-400 hover:text-rose-500 transition-colors font-inter">
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        <table className="w-full text-left font-inter min-w-[1200px]">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                    <th className="px-6 py-4 font-inter">Requisition Identity</th>
                                    <th className="px-6 py-4 font-inter">Resource Requisition</th>
                                    <th className="px-6 py-4 font-inter">Operational Status</th>
                                    <th className="px-6 py-4 font-inter">Volume / Quantity</th>
                                    <th className="px-6 py-4 text-right font-inter">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-inter">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center font-inter">
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
                                                    <span className="text-sm font-bold text-slate-800 font-inter">REQ-#{request.id}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-inter mt-0.5">Procurement Log</span>
                                                </div>
                                            </td>
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
                                        <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter">
                                            No procurement requisitions discovered in the project vault.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* â”€â”€ Pagination Controls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    {!isLoading && filteredRequests.length > 0 && (
                        <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between bg-white sticky left-0 font-inter">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-inter">
                                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} entries
                            </span>
                            <div className="flex items-center gap-2 font-inter">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 transition-all shadow-sm bg-white active:scale-95 flex items-center justify-center font-inter"
                                    title="Previous Page"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="px-4 py-2 bg-primary/10 rounded-xl text-[10px] font-bold text-primary font-inter">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage >= totalPages}
                                    className="p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 transition-all shadow-sm bg-white active:scale-95 flex items-center justify-center font-inter"
                                    title="Next Page"
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
                                    <p className="text-sm font-bold text-slate-800 font-inter uppercase tracking-widest">User #{selectedRequest.requested_by || "SYST"}</p>
                                </div>
                                <div className="font-inter">
                                    <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-1.5')}>Approving Authority</p>
                                    <p className="text-sm font-bold text-blue-600 font-inter uppercase tracking-widest">{selectedRequest.approved_by ? `User ${selectedRequest.approved_by}` : "Pending Review"}</p>
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
                                    <option value="Labour">Labour</option>
                                    <option value="Equipment">Equipment</option>
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
