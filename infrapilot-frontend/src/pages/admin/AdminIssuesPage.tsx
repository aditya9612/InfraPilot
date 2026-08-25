import { useState, useEffect, useMemo, useCallback } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import ConfirmModal from "../../components/common/ConfirmModal";
import StatCard from "../../components/common/StatCard";
import { Search, Filter, AlertCircle, Edit2, Trash2, RotateCcw, Eye, Mail, Briefcase, Activity, Download, Loader2, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";
import { useProject } from "../../context/ProjectContext";
import { issueService } from "../../services/issueService";
import { projectService } from "../../services/projectService";
import type { IssueItem, CreateIssueRequest, UpdateIssueRequest } from "../../types/issue";

const AdminIssuesPage = () => {
    const { selectedProjectId, assignedProjects } = useProject();
    const [issues, setIssues] = useState<IssueItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [projectFilter, setProjectFilter] = useState<number | "all">(selectedProjectId || "all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isExportingExcel, setIsExportingExcel] = useState(false);

    // Export Modal State
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportType, setExportType] = useState<"pdf" | "excel" | null>(null);
    const [exportFilters, setExportFilters] = useState({
        status: "all",
        priority: "all",
        start_date: "",
        end_date: ""
    });

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [projectMembers, setProjectMembers] = useState<any[]>([]);

    const [formData, setFormData] = useState<CreateIssueRequest & UpdateIssueRequest>({
        project_id: selectedProjectId || 0,
        title: "",
        category: "Material",
        description: "",
        reported_date: new Date().toISOString().split("T")[0],
        priority: "Medium",
        status: "Open",
        assigned_to: 0,
        resolution: ""
    });

    useEffect(() => {
        const fetchMembers = async () => {
            if (formData.project_id) {
                try {
                    const res = await projectService.getProjectMembers(formData.project_id);
                    const membersList = Array.isArray(res) ? res : (res?.items || res?.data || []);
                    setProjectMembers(membersList);
                } catch (error) {
                    console.error("Failed to fetch project members", error);
                    setProjectMembers([]);
                }
            } else {
                setProjectMembers([]);
            }
        };
        fetchMembers();
    }, [formData.project_id]);

    const fetchIssues = useCallback(async () => {
        setIsLoading(true);
        try {
            if (projectFilter !== "all" && projectFilter !== 0) {
                const res = await issueService.getIssuesByProject(projectFilter as number);
                setIssues(res.items || []);
            } else {
                const res = await issueService.getIssues();
                setIssues(res.items || []);
            }
        } catch (error) {
            toast.error("Failed to load issues");
        } finally {
            setIsLoading(false);
        }
    }, [projectFilter]);

    useEffect(() => {
        setProjectFilter(selectedProjectId || "all");
    }, [selectedProjectId]);

    useEffect(() => {
        fetchIssues();
    }, [fetchIssues]);

    // Derived Data
    const filteredIssues = useMemo(() => {
        return issues.filter(issue => {
            const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                issue.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "all" || issue.status.toLowerCase() === statusFilter.toLowerCase();
            const matchesPriority = priorityFilter === "all" || issue.priority.toLowerCase() === priorityFilter.toLowerCase();
            const matchesCategory = categoryFilter === "all" || issue.category.toLowerCase() === categoryFilter.toLowerCase();

            return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
        });
    }, [issues, searchTerm, statusFilter, priorityFilter, categoryFilter]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, priorityFilter, categoryFilter, projectFilter]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredIssues.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);

    const stats = useMemo(() => {
        const total = issues.length;
        const open = issues.filter(i => i.status === 'Open').length;
        const closed = issues.filter(i => i.status === 'Closed').length;
        const critical = issues.filter(i => i.priority === 'Critical' && i.status === 'Open').length;
        return { total, open, closed, critical };
    }, [issues]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreate = async () => {
        if (!formData.title || !formData.description) {
            toast.error("Please fill in the title and description.");
            return;
        }
        setIsSubmitting(true);
        try {
            await issueService.createIssue({
                project_id: selectedProjectId || formData.project_id,
                title: formData.title,
                category: formData.category,
                description: formData.description,
                reported_date: formData.reported_date,
                priority: formData.priority
            });
            toast.success("Issue reported successfully!");
            setIsCreateModalOpen(false);
            setFormData({
                project_id: selectedProjectId || 0,
                title: "",
                category: "Material",
                description: "",
                reported_date: new Date().toISOString().split("T")[0],
                priority: "Medium",
                status: "Open",
                assigned_to: 0,
                resolution: ""
            });
            fetchIssues();
        } catch (error) {
            toast.error("Failed to report issue");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExport = async () => {
        if (exportType === "pdf") {
            setIsExportingPdf(true);
            try {
                const blob = await issueService.exportIssuesPdf({
                    project_id: selectedProjectId || undefined,
                    status: exportFilters.status !== "all" ? exportFilters.status : undefined,
                    priority: exportFilters.priority !== "all" ? exportFilters.priority : undefined,
                    start_date: exportFilters.start_date || undefined,
                    end_date: exportFilters.end_date || undefined,
                });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `issues_report_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success("PDF exported successfully!");
                setIsExportModalOpen(false);
            } catch (error) {
                console.error(error);
                toast.error("Failed to export PDF");
            } finally {
                setIsExportingPdf(false);
            }
        } else if (exportType === "excel") {
            setIsExportingExcel(true);
            try {
                const blob = await issueService.exportIssuesExcel({
                    project_id: selectedProjectId || undefined,
                    status: exportFilters.status !== "all" ? exportFilters.status : undefined,
                    priority: exportFilters.priority !== "all" ? exportFilters.priority : undefined,
                    start_date: exportFilters.start_date || undefined,
                    end_date: exportFilters.end_date || undefined,
                });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `issues_report_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success("Excel exported successfully!");
                setIsExportModalOpen(false);
            } catch (error) {
                console.error(error);
                toast.error("Failed to export Excel");
            } finally {
                setIsExportingExcel(false);
            }
        }
    };

    const handleUpdate = async () => {
        if (!selectedIssue) return;

        if (formData.status === "Closed" && (!formData.resolution || formData.resolution.trim() === "")) {
            toast.error("Resolution is required to close the issue.");
            return;
        }

        setIsSubmitting(true);
        try {
            await issueService.updateIssue(selectedIssue.id, {
                title: formData.title,
                category: formData.category,
                description: formData.description,
                priority: formData.priority,
                status: formData.status,
                assigned_to: Number(formData.assigned_to) === 0 ? null : Number(formData.assigned_to),
                resolution: formData.resolution
            });
            toast.success("Issue updated successfully!");
            setIsEditModalOpen(false);
            setSelectedIssue(null);
            fetchIssues();
        } catch (error) {
            toast.error("Failed to update issue");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTargetId) return;
        setIsSubmitting(true);
        try {
            await issueService.deleteIssue(deleteTargetId);
            toast.success("Issue removed.");
            setIsDeleteModalOpen(false);
            setDeleteTargetId(null);
            fetchIssues();
        } catch (error) {
            toast.error("Failed to remove issue");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (issue: IssueItem) => {
        setSelectedIssue(issue);
        setFormData({
            project_id: issue.project_id,
            title: issue.title,
            category: issue.category,
            description: issue.description,
            reported_date: issue.reported_date,
            priority: issue.priority,
            status: issue.status,
            assigned_to: issue.assigned_to || 0,
            resolution: issue.resolution || ""
        });
        setIsEditModalOpen(true);
    };

    const openViewModal = async (issue: IssueItem) => {
        setSelectedIssue(issue);
        setFormData({
            project_id: issue.project_id,
            title: issue.title,
            category: issue.category,
            description: issue.description,
            reported_date: issue.reported_date,
            priority: issue.priority,
            status: issue.status,
            assigned_to: issue.assigned_to || 0,
            resolution: issue.resolution || ""
        });
        setIsViewModalOpen(true);

        try {
            const freshIssue = await issueService.getIssue(issue.id);
            if (freshIssue) {
                setSelectedIssue(freshIssue);
                setFormData({
                    project_id: freshIssue.project_id,
                    title: freshIssue.title,
                    category: freshIssue.category,
                    description: freshIssue.description,
                    reported_date: freshIssue.reported_date,
                    priority: freshIssue.priority,
                    status: freshIssue.status,
                    assigned_to: freshIssue.assigned_to || 0,
                    resolution: freshIssue.resolution || ""
                });
            }
        } catch (error) {
            console.error("Failed to fetch fresh issue details:", error);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "Critical": return "bg-rose-100 text-rose-700 border-rose-200";
            case "High": return "bg-orange-100 text-orange-700 border-orange-200";
            case "Medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "Low": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    return (
        <>
            <Navbar title="Issue Management" breadcrumb={["Admin", "Operations", "Issues"]} />
            <PageTransition key="admin-issues" className="p-6 bg-slate-50 min-h-screen">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Project Issues</h1>
                        <p className="text-slate-500 text-sm">Track, manage, and resolve critical project bottlenecks.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchIssues} className="p-2 bg-white text-slate-400 hover:text-primary rounded-xl border border-slate-200 shadow-sm transition-colors">
                            <RotateCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setExportType("excel");
                                    setExportFilters({ status: "all", priority: "all", start_date: "", end_date: "" });
                                    setIsExportModalOpen(true);
                                }}
                                disabled={isExportingExcel || isExportingPdf}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isExportingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                Excel
                            </button>
                            <button
                                onClick={() => {
                                    setExportType("pdf");
                                    setExportFilters({ status: "all", priority: "all", start_date: "", end_date: "" });
                                    setIsExportModalOpen(true);
                                }}
                                disabled={isExportingPdf || isExportingExcel}
                                className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                PDF
                            </button>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                            >
                                Report Issue
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Issues" value={stats.total.toString()} sub="All time" accent="text-blue-500" />
                    <StatCard title="Open Issues" value={stats.open.toString()} sub="Pending resolution" accent="text-amber-500" />
                    <StatCard title="Closed Issues" value={stats.closed.toString()} sub="Resolved" accent="text-emerald-500" />
                    <StatCard title="Critical" value={stats.critical.toString()} sub="Requires immediate action" accent="text-rose-500" />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
                    <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search issues..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <select value={projectFilter} onChange={e => setProjectFilter(e.target.value === "all" ? "all" : Number(e.target.value))} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none max-w-[200px] truncate">
                                <option value="all">All Assigned Projects</option>
                                {assignedProjects.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.project_name || (p as any).name || `Project ${p.id}`}
                                    </option>
                                ))}
                            </select>
                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-transparent text-xs font-bold text-slate-600 outline-none">
                                    <option value="all">All Statuses</option>
                                    <option value="open">Open</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none">
                                <option value="all">All Priorities</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none">
                                <option value="all">All Categories</option>
                                <option value="material">Material</option>
                                <option value="safety">Safety</option>
                                <option value="delay">Delay</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                                    <th className="px-6 py-4">Title & Category</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4">Priority</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <div className="inline-block w-6 h-6 border-2 border-t-transparent border-primary rounded-full animate-spin mb-2"></div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Issues...</p>
                                        </td>
                                    </tr>
                                ) : currentItems.length > 0 ? (
                                    currentItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">{item.title}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.category}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs text-slate-500 max-w-xs truncate">{item.description}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getPriorityColor(item.priority)}`}>
                                                    {item.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest ${item.status === 'Closed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                                                {new Date(item.reported_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1 items-center transition-opacity">
                                                    <button onClick={() => openViewModal(item)} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="View">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => openEditModal(item)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => { setDeleteTargetId(item.id); setIsDeleteModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                                                <AlertCircle className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-400">No issues found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    {filteredIssues.length > 0 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Page {currentPage} of {totalPages}
                            </span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                {Array.from({ length: totalPages }).map((_, i) => {
                                    const page = i + 1;
                                    if (
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${currentPage === page
                                                    ? "bg-primary text-white shadow-sm shadow-primary/20"
                                                    : "text-slate-500 hover:bg-slate-100"
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    } else if (
                                        page === currentPage - 2 ||
                                        page === currentPage + 2
                                    ) {
                                        return <span key={page} className="text-slate-400 font-bold px-1 flex items-center justify-center">...</span>;
                                    }
                                    return null;
                                })}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage >= totalPages}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </PageTransition>

            {/* Create Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Report New Issue"
                maxWidth="max-w-xl"
                footer={
                    <>
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={isSubmitting}
                            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2"
                        >
                            {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            Submit Issue
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Project</label>
                            <select name="project_id" value={formData.project_id} onChange={handleInputChange} disabled={!!selectedProjectId} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-100 disabled:text-slate-500">
                                <option value={0}>Select Project</option>
                                {assignedProjects.map(p => (
                                    <option key={p.id} value={p.id}>{p.project_name || (p as any).name || `Project ${p.id}`}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Title *</label>
                            <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Category</label>
                            <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                <option value="Material">Material</option><option value="Safety">Safety</option><option value="Delay">Delay</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Reported Date</label>
                            <input type="date" name="reported_date" value={formData.reported_date} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Description *</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Priority</label>
                        <select name="priority" value={formData.priority} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary">
                            <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                        </select>
                    </div>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setSelectedIssue(null); }}
                title="Modify Issue"
                maxWidth="max-w-2xl"
                footer={
                    <>
                        <button onClick={() => { setIsEditModalOpen(false); setSelectedIssue(null); }} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50" disabled={isSubmitting}>Cancel</button>
                        <button onClick={handleUpdate} disabled={isSubmitting} className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2">
                            {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            Save Changes
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Title *</label>
                            <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Category</label>
                            <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                <option value="Material">Material</option><option value="Safety">Safety</option><option value="Delay">Delay</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Description *</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Priority</label>
                            <select name="priority" value={formData.priority} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Status</label>
                            <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                <option value="Open">Open</option><option value="Closed">Closed</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Assigned To</label>
                            <select name="assigned_to" value={formData.assigned_to || 0} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                <option value={0}>Unassigned</option>
                                {projectMembers.map(member => (
                                    <option key={member.user_id || member.id} value={member.user_id || member.id}>
                                        {member.full_name || member.name || member.username || `User ${member.user_id || member.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Reported Date</label>
                            <input type="date" name="reported_date" value={formData.reported_date} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Resolution</label>
                        <textarea name="resolution" value={formData.resolution || ""} onChange={handleInputChange} rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" placeholder="Details of how the issue was resolved (if closed)..." />
                    </div>
                </div>
            </Modal>

            {/* View Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => { setIsViewModalOpen(false); setSelectedIssue(null); }}
                title="Constraint Intelligence Insight"
                maxWidth="max-w-xl"
                footer={null}
            >
                <div className="space-y-6">
                    {/* Blue Banner */}
                    <div className="bg-blue-600 rounded-2xl p-6 shadow-lg relative overflow-hidden flex items-center gap-5">
                        <div className="relative">
                            <div className="w-16 h-16 bg-blue-500/50 rounded-2xl flex items-center justify-center border border-blue-400/30 shadow-inner">
                                <span className="text-4xl font-bold text-white lowercase">{formData.title ? formData.title.charAt(0) : 'i'}</span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-blue-600"></div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-bold text-white tracking-tight">{formData.title}</h2>
                                <span className="px-2.5 py-0.5 bg-blue-700/50 text-[10px] font-bold text-white rounded uppercase tracking-widest">{formData.status}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-blue-200 text-xs font-medium mb-3">
                                <Mail className="w-3.5 h-3.5" />
                                <span>ISSUE.REF</span>
                            </div>
                            <div className="inline-flex items-center px-3 py-1.5 bg-blue-500/80 hover:bg-blue-500 rounded-lg border border-blue-400/50 transition-colors shadow-sm">
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Priority: {formData.priority}</span>
                            </div>
                        </div>
                    </div>

                    {/* ISSUE PARAMETERS */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                <Briefcase className="w-4 h-4 text-blue-500" />
                            </div>
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issue Parameters</h3>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-5">
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Project</div>
                                <div className="text-sm font-bold text-slate-800 uppercase truncate">
                                    {(assignedProjects.find(p => p.id === formData.project_id) as any)?.project_name || (assignedProjects.find(p => p.id === formData.project_id) as any)?.name || 'UNKNOWN'}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Category</div>
                                <div className="text-sm font-bold text-slate-800 uppercase">{formData.category}</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Priority</div>
                                <div className={`text-sm font-bold uppercase ${formData.priority === 'Critical' ? 'text-rose-500' : formData.priority === 'High' ? 'text-orange-500' : formData.priority === 'Low' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {formData.priority}
                                </div>
                            </div>
                        </div>

                        <div className="mb-5">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description</div>
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-medium text-slate-700">
                                "{formData.description}"
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Assigned To</div>
                                <div className="text-sm font-bold text-slate-800 uppercase truncate">
                                    {formData.assigned_to ? (projectMembers.find(m => (m.user_id || m.id) === formData.assigned_to)?.full_name || projectMembers.find(m => (m.user_id || m.id) === formData.assigned_to)?.name || `User ${formData.assigned_to}`) : "UNASSIGNED"}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Resolution</div>
                                <div className="text-sm font-bold text-slate-800 uppercase">
                                    {formData.resolution || "PENDING"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SEQUENCE AUDIT */}
                    <div className="pt-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-blue-500" />
                            </div>
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sequence Audit</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reported</div>
                                <div className="text-sm font-bold text-slate-800 uppercase">{formData.reported_date}</div>
                            </div>
                            {/* Reference ID hidden as requested */}
                            <div></div>
                        </div>
                    </div>

                    <button
                        onClick={() => { setIsViewModalOpen(false); setSelectedIssue(null); }}
                        className="w-full mt-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] shadow-md shadow-blue-500/20"
                    >
                        Dismiss
                    </button>
                </div>
            </Modal>

            {/* Export Modal */}
            <Modal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                title="Site Issues Report — Filters"
                maxWidth="max-w-[420px]"
                footer={null}
            >
                <div className="p-6 flex flex-col gap-6">
                    {/* Header Banner */}
                    <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex flex-shrink-0 items-center justify-center ${exportType === 'pdf' ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                            {exportType === 'pdf' ? (
                                <Download className="w-5 h-5 text-rose-500" />
                            ) : (
                                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">
                                {exportType === 'pdf' ? 'PDF Export' : 'Excel Export'}
                            </h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Filter Issues Before Exporting</p>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Status</label>
                        <div className="flex flex-wrap gap-2">
                            {['all', 'open', 'closed'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setExportFilters({ ...exportFilters, status: s })}
                                    className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase transition-all ${exportFilters.status === s
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                        : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Priority</label>
                        <div className="flex flex-wrap gap-2">
                            {['all', 'high', 'medium', 'low'].map(p => {
                                const isSelected = exportFilters.priority === p;
                                let colorClass = 'border-slate-200 text-slate-500 hover:border-slate-300';
                                if (isSelected) {
                                    if (p === 'all') colorClass = 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20';
                                    else if (p === 'high') colorClass = 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm';
                                    else if (p === 'medium') colorClass = 'bg-amber-50 border-amber-200 text-amber-600 shadow-sm';
                                    else if (p === 'low') colorClass = 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm';
                                } else {
                                    if (p === 'high') colorClass = 'border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300';
                                    else if (p === 'medium') colorClass = 'border-amber-200 text-amber-500 hover:bg-amber-50 hover:border-amber-300';
                                    else if (p === 'low') colorClass = 'border-emerald-200 text-emerald-500 hover:bg-emerald-50 hover:border-emerald-300';
                                }

                                return (
                                    <button
                                        key={p}
                                        onClick={() => setExportFilters({ ...exportFilters, priority: p })}
                                        className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase border transition-all ${colorClass} ${p === 'all' && !isSelected ? 'bg-white' : ''}`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
                            <input
                                type="date"
                                value={exportFilters.start_date}
                                onChange={(e) => setExportFilters({ ...exportFilters, start_date: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">End Date</label>
                            <input
                                type="date"
                                value={exportFilters.end_date}
                                onChange={(e) => setExportFilters({ ...exportFilters, end_date: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={() => setExportFilters({ status: "all", priority: "all", start_date: "", end_date: "" })}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors border border-slate-100"
                        >
                            <Filter className="w-3.5 h-3.5" />
                            Reset
                        </button>
                        <button
                            onClick={() => setIsExportModalOpen(false)}
                            className="px-6 py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors border border-slate-100"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={(exportType === 'pdf' ? isExportingPdf : isExportingExcel)}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70"
                        >
                            {(exportType === 'pdf' ? isExportingPdf : isExportingExcel) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Export Report
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </button>
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Issue"
                message="Are you sure you want to delete this issue? This action cannot be undone."
                confirmText="Yes, Delete"
            />
        </>
    );
};

export default AdminIssuesPage;
