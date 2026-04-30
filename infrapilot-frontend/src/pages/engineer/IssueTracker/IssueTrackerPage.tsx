import React, { useState, useMemo, useEffect, useCallback } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";

import { issueService } from "../../../services/issueService";
import type { IssueItem } from "../../../types/issue";

// ─── Constants ──────────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
    High: "bg-rose-50 text-rose-600 border-rose-100",
    Medium: "bg-amber-50 text-amber-600 border-amber-100",
    Low: "bg-emerald-50 text-emerald-600 border-emerald-100",
};

const STATUS_COLORS: Record<string, string> = {
    Open: "bg-rose-50 text-rose-600",
    Closed: "bg-emerald-50 text-emerald-600",
    "In Progress": "bg-blue-50 text-blue-600",
};

const INITIAL_FORM_DATA = {
    project_id: 1,
    title: "",
    category: "Material",
    description: "",
    reported_date: new Date().toISOString().split("T")[0],
    priority: "Medium",
    assigned_to: "" as any,
    status: "Open",
    resolution: "",
};

// ─── Demo Data ──────────────────────────────────────────────────────────────
const DEMO_ISSUES: IssueItem[] = [
    {
        id: 1001,
        business_id: "ISS-1001",
        project_id: 1,
        title: "Shortage of Grade-43 Cement",
        category: "Material",
        description: "Supply chain delay from local vendor is affecting structural concrete works in Zone B.",
        reported_date: new Date().toISOString().split("T")[0],
        priority: "High",
        status: "Open",
        assigned_to: null,
        resolution: null,
    },
    {
        id: 1002,
        business_id: "ISS-1002",
        project_id: 1,
        title: "Pier 14 Design Approval Pending",
        category: "Safety",
        description: "Revised structural drawings for Pier 14 are stuck with the consultant since last Monday.",
        reported_date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
        priority: "High",
        status: "Open",
        assigned_to: null,
        resolution: null,
    },
    {
        id: 1003,
        business_id: "ISS-1003",
        project_id: 1,
        title: "Excavator Hydraulic Failure",
        category: "Material",
        description: "Primary excavator (EX-04) experienced hydraulic leak. Maintenance team is on site.",
        reported_date: new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0],
        priority: "Medium",
        status: "Closed",
        assigned_to: 102,
        resolution: "Hydraulic hose replaced and fluid refilled. Tested and operational.",
    }
];

const IssueTrackerPage = () => {
    // Data State
    const [issueData, setIssueData] = useState<IssueItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");

    // Modal State
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [issueToDelete, setIssueToDelete] = useState<number | null>(null);

    // ─── Dynamic Project ID ──────────────────────────────────────────────────
    const [projectId, setProjectId] = useState<number | null>(null);

    useEffect(() => {
        const resolveProjectId = async () => {
            // Step 1: try localStorage user profile
            const userStr = localStorage.getItem("infrapilot_user");
            const user = userStr ? JSON.parse(userStr) : {};
            const pId =
                user?.project_id ||
                user?.user?.project_id ||
                user?.user?.project?.id ||
                user?.user?.assigned_project?.id;

            if (pId) {
                console.log("Issues: Project ID from profile:", pId);
                setProjectId(Number(pId));
                setFormData(prev => ({ ...prev, project_id: Number(pId) }));
                return;
            }

            // Step 2: API discovery — GET /api/v1/projects
            try {
                const api = (await import("../../../services/api")).default;
                const { data } = await api.get("/projects");
                const items = Array.isArray(data) ? data : (data.items || data.projects || []);
                if (items.length > 0) {
                    const firstId = Number(items[0].project_id || items[0].id);
                    console.log("Issues: Project ID from API discovery:", firstId);
                    setProjectId(firstId);
                    setFormData(prev => ({ ...prev, project_id: firstId }));
                } else {
                    console.warn("Issues: No projects found via API. Using default 1.");
                    setProjectId(1);
                }
            } catch (e) {
                console.error("Issues: Project discovery failed:", e);
                setProjectId(1);
            }
        };

        resolveProjectId();
    }, []);

    // ─── Persistence Layer ────────────────────────────────────────────────────
    const getLocalIssues = (): IssueItem[] => {
        const stored = localStorage.getItem("demo_issue_list");
        return stored ? JSON.parse(stored) : [];
    };

    const saveLocalIssues = (issues: IssueItem[]) => {
        localStorage.setItem("demo_issue_list", JSON.stringify(issues));
    };

    const fetchIssues = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            // Attempt to fetch from API
            let apiIssues: IssueItem[] = [];
            try {
                const response = await issueService.listIssuesByProject(projectId);
                apiIssues = response.items;
            } catch (err) {
                console.warn("API unavailable, using local/demo data only.");
            }

            // Merge with local storage
            const localIssues = getLocalIssues();

            // Combine and unique by ID
            const combined = [...apiIssues, ...localIssues];
            const unique = combined.reduce((acc: IssueItem[], curr) => {
                if (!acc.find(item => item.id === curr.id)) {
                    acc.push(curr);
                }
                return acc;
            }, []);

            // If empty, seed with demo data
            if (unique.length === 0) {
                setIssueData(DEMO_ISSUES);
                saveLocalIssues(DEMO_ISSUES);
            } else {
                setIssueData(unique);
            }
        } catch (error) {
            toast.error("Failed to sync issues");
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchIssues();
    }, [fetchIssues]);

    // ─── Handlers ──────────────────────────────────────────────────────────────
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!formData.title.trim()) errs.title = "Title is required";
        if (!formData.description.trim()) errs.description = "Description is required";
        if (!formData.category) errs.category = "Category is required";
        if (!formData.priority) errs.priority = "Priority is required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId) {
            toast.error("Project not loaded yet. Please wait a moment and try again.");
            return;
        }
        if (!validate()) {
            toast.error("Please fill all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            if (formMode === "create") {
                const payload = {
                    project_id: projectId,
                    title: formData.title,
                    category: formData.category,
                    description: formData.description,
                    reported_date: formData.reported_date,
                    priority: formData.priority,
                };

                console.log("POST /api/v1/issues → Request Body:", payload);
                const apiResponse = await issueService.createIssue(payload);
                console.log("POST /api/v1/issues → Response Body:", apiResponse);

                // Persist the actual server response in localStorage
                const currentLocal = getLocalIssues();
                saveLocalIssues([apiResponse, ...currentLocal]);
                toast.success("Issue lodged successfully!");

            } else if (selectedIssue) {
                const updatePayload = {
                    title: formData.title,
                    category: formData.category,
                    description: formData.description,
                    priority: formData.priority,
                    status: formData.status,
                    assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
                    resolution: formData.resolution
                };

                console.log(`PUT /api/v1/issues/${selectedIssue.id} → Request Body:`, updatePayload);
                const updateResponse = await issueService.updateIssue(selectedIssue.id, updatePayload);
                console.log(`PUT /api/v1/issues/${selectedIssue.id} → Response Body:`, updateResponse);

                const currentLocal = getLocalIssues();
                const updatedLocal = currentLocal.map(i => i.id === selectedIssue.id ? updateResponse : i);
                saveLocalIssues(updatedLocal);
                toast.success("Issue updated successfully!");
            }

            setIsFormModalOpen(false);
            fetchIssues();
        } catch (error: any) {
            let detail = "An error occurred while saving";
            if (error?.response?.data?.detail) {
                const rawDetail = error.response.data.detail;
                if (Array.isArray(rawDetail)) {
                    // Handle Pydantic validation errors (array of objects)
                    detail = rawDetail.map(err => `${err.msg} (${err.loc.join('.')})`).join(", ");
                } else {
                    detail = rawDetail;
                }
            }
            console.error("Issue API Error:", error?.response?.data || error);
            toast.error(detail);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        setIssueToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!issueToDelete) return;
        try {
            try {
                await issueService.deleteIssue(issueToDelete);
            } catch (apiErr) {
                console.warn("Could not delete from server, deleting locally.");
            }

            const currentLocal = getLocalIssues();
            saveLocalIssues(currentLocal.filter(i => i.id !== issueToDelete));
            toast.success("Issue deleted successfully");
            setIsDeleteModalOpen(false);
            setIssueToDelete(null);
            fetchIssues();
        } catch (error) {
            toast.error("Failed to delete issue");
        }
    };

    const openCreate = () => {
        setFormMode("create");
        setFormData(INITIAL_FORM_DATA);
        setErrors({});
        setIsFormModalOpen(true);
    };

    const openEdit = (issue: IssueItem) => {
        setFormMode("edit");
        setSelectedIssue(issue);
        setFormData({
            project_id: issue.project_id,
            title: issue.title,
            category: issue.category,
            description: issue.description,
            reported_date: issue.reported_date,
            priority: issue.priority,
            status: issue.status,
            assigned_to: issue.assigned_to || "",
            resolution: issue.resolution || "",
        });
        setErrors({});
        setIsFormModalOpen(true);
    };



    // ─── Filtering Logic ──────────────────────────────────────────────────────
    const filteredIssues = useMemo(() => {
        return issueData.filter(i => {
            const matchesSearch = i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                i.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (i.business_id && i.business_id.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = statusFilter === "All" || i.status === statusFilter;
            const matchesPriority = priorityFilter === "All" || i.priority === priorityFilter;
            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [issueData, searchTerm, statusFilter, priorityFilter]);

    // ─── Stats ────────────────────────────────────────────────────────────────
    const stats = {
        total: issueData.length,
        open: issueData.filter(i => i.status === "Open").length,
        high: issueData.filter(i => i.priority === "High").length,
        closed: issueData.filter(i => i.status === "Closed").length,
    };

    return (
        <>
            <Navbar title="Issue Tracker" breadcrumb={["InfraPilot", "Engineer", "Issues"]} />

            <PageTransition className="p-6 md:p-8 bg-slate-50 min-h-screen font-inter">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">
                            Operational Bottlenecks
                        </p>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                            Constraint Management Registry
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Identify, track, and resolve site impediments to maintain project momentum.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">

                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/25 hover:bg-blue-600 transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <span className="text-lg leading-none">+</span>
                            Lodge Site Issue
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: "Total Logs", value: stats.total, sub: "Historical Records", color: "text-slate-900" },
                        { label: "Pending Issues", value: stats.open, sub: "Action Required", color: "text-rose-500", glow: "shadow-rose-500/10" },
                        { label: "High Priority", value: stats.high, sub: "Critical Impact", color: "text-amber-500" },
                        { label: "Resolved", value: stats.closed, sub: "Success Rate", color: "text-emerald-500" },
                    ].map((s, idx) => (
                        <div key={idx} className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all relative overflow-hidden group ${s.glow || ""}`}>
                            <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-full -mr-8 -mt-8 transition-all group-hover:scale-110" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">{s.label}</p>
                            <p className={`text-3xl font-black ${s.color} relative z-10 tracking-tight`}>{s.value}</p>
                            <div className="flex items-center gap-1.5 mt-2 relative z-10">
                                <div className={`w-1.5 h-1.5 rounded-full ${s.color.replace('text', 'bg')}`} />
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter Bar */}
                <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 mb-8 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-2 flex-1 min-w-[280px] border border-slate-50 focus-within:border-primary/20 focus-within:bg-white transition-all">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            placeholder="Search by ID, Title or Description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent text-sm font-bold text-slate-600 outline-none w-full placeholder:text-slate-400 italic-none"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-black text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                            >
                                <option value="All">All Status</option>
                                <option value="Open">Open</option>
                                <option value="Closed">Closed</option>
                                <option value="In Progress">In Progress</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority:</span>
                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-black text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                            >
                                <option value="All">All Priority</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Issue Grid */}
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                        <p className="text-sm font-black uppercase tracking-widest">Syncing Registry...</p>
                    </div>
                ) : filteredIssues.length === 0 ? (
                    <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-100 p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">Registry is Clean</h3>
                        <p className="text-slate-300 text-sm mt-2 font-medium">No site impediments matched your current filter parameters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-20">
                        {filteredIssues.map((issue) => (
                            <div
                                key={issue.id}
                                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group flex flex-col relative overflow-hidden"
                            >
                                {/* Priority Glow */}
                                <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full blur-3xl opacity-10 ${issue.priority === 'High' ? 'bg-rose-500' : issue.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />

                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{issue.business_id || `ISS-${issue.id}`}</span>
                                    <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${STATUS_COLORS[issue.status] || "bg-slate-100 text-slate-500"}`}>
                                        {issue.status}
                                    </div>
                                </div>

                                <h3 className="text-lg font-black text-slate-800 leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2 min-h-[3rem]">
                                    {issue.title}
                                </h3>
                                <div className="flex items-center gap-2 mb-4 relative z-10">
                                    <div className={`w-1.5 h-1.5 rounded-full ${issue.priority === 'High' ? 'bg-rose-500 animate-pulse' : issue.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${PRIORITY_COLORS[issue.priority]}`}>
                                        {issue.priority} Priority
                                    </span>
                                </div>

                                <p className="text-xs text-slate-500 font-medium line-clamp-3 mb-6 flex-grow leading-relaxed italic-none">
                                    {issue.description}
                                </p>

                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                                    <div className="flex flex-col">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Logged On</p>
                                        <p className="text-[11px] font-bold text-slate-700">{issue.reported_date}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setSelectedIssue(issue)}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                            title="View Analysis"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        </button>
                                        <button
                                            onClick={() => openEdit(issue)}
                                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                                            title="Modify"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(issue.id)}
                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                            title="Delete"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </PageTransition>

            {/* ── INLINE MODALS ─────────────────────────────────────────────────── */}

            {/* Form Modal (Create/Edit) */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={formMode === 'create' ? "Lodge New Site Issue" : "Modify Constraint Log"}
                maxWidth="max-w-xl"
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Issue Headline</label>
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="e.g., Shortage of Reinforcement Steel"
                                className={`w-full px-4 py-3 bg-slate-50 border ${errors.title ? 'border-rose-300 ring-4 ring-rose-500/5' : 'border-slate-100'} rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all`}
                            />
                            {errors.title && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1 uppercase">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                            >
                                <option value="Material">Material</option>
                                <option value="Safety">Safety</option>
                                <option value="Delay">Delay</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Priority Matrix</label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                            >
                                <option value="Low">Low Impact</option>
                                <option value="Medium">Medium Impact</option>
                                <option value="High">High Impact (Critical)</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Operational Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="Describe the impact on project timeline/scope..."
                                className={`w-full px-4 py-3 bg-slate-50 border ${errors.description ? 'border-rose-300 ring-4 ring-rose-500/5' : 'border-slate-100'} rounded-2xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all resize-none`}
                            />
                            {errors.description && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1 uppercase">{errors.description}</p>}
                        </div>

                        {formMode === 'edit' && (
                            <>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Workflow Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                                    >
                                        <option value="Open">Open</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Closed">Closed / Resolved</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Resolution Detail</label>
                                    <input
                                        name="resolution"
                                        value={formData.resolution}
                                        onChange={handleInputChange}
                                        placeholder="Brief summary of resolution..."
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="pt-6 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setIsFormModalOpen(false)}
                            className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] py-3.5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/25 hover:bg-blue-600 transition-all uppercase tracking-widest text-xs disabled:opacity-50"
                        >
                            {isSubmitting ? "Processing..." : formMode === 'create' ? "Lodge Issue" : "Update Log"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Detail Modal (Analysis View) */}
            <Modal
                isOpen={!!selectedIssue && !isFormModalOpen}
                onClose={() => setSelectedIssue(null)}
                title="Issue Impact Analysis"
                maxWidth="max-w-2xl"
            >
                {selectedIssue && (
                    <div className="p-8">
                        {/* Header Highlight */}
                        <div className={`rounded-[2.5rem] p-8 text-white shadow-2xl mb-8 relative overflow-hidden ${selectedIssue.priority === 'High' ? 'bg-gradient-to-br from-rose-500 to-rose-600' : selectedIssue.priority === 'Medium' ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'}`}>
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em]">{selectedIssue.category}</span>
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em]">{selectedIssue.priority} Priority</span>
                                </div>
                                <h3 className="text-3xl font-black mb-2 tracking-tight leading-tight">{selectedIssue.title}</h3>
                                <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Logged on {selectedIssue.reported_date} • {selectedIssue.business_id}</p>
                            </div>
                        </div>

                        {/* Analysis Content */}
                        <div className="space-y-8">
                            <section>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-1">Impact Narrative</h4>
                                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                                    <p className="text-sm font-medium text-slate-600 leading-relaxed italic-none">
                                        {selectedIssue.description}
                                    </p>
                                </div>
                            </section>

                            <div className="grid grid-cols-2 gap-8">
                                <section>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-1">Ownership</h4>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-primary font-black text-xs">
                                            {selectedIssue.assigned_to ? "USR" : "NA"}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-700 uppercase tracking-widest">{selectedIssue.assigned_to || "Unassigned"}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Responsible Party</p>
                                        </div>
                                    </div>
                                </section>
                                <section>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 ml-1">Current State</h4>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${selectedIssue.status === 'Closed' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {selectedIssue.status === 'Closed' ? "✓" : "!"}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-700 uppercase tracking-widest">{selectedIssue.status}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Resolution Progress</p>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {selectedIssue.resolution && (
                                <section>
                                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-3 ml-1">Resolution Strategy</h4>
                                    <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100">
                                        <p className="text-sm font-bold text-emerald-700 leading-relaxed italic-none">
                                            {selectedIssue.resolution}
                                        </p>
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="mt-10 flex gap-4">
                            <button
                                onClick={() => setSelectedIssue(null)}
                                className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                            >
                                Close View
                            </button>
                            <button
                                onClick={() => openEdit(selectedIssue)}
                                className="flex-[2] py-4 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/30 hover:bg-blue-600 transition-all uppercase tracking-widest text-xs"
                            >
                                Update Documentation
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setIssueToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Issue Log"
                message="Are you sure you want to delete this site issue record? This will permanently remove the bottleneck documentation and resolution strategy."
                confirmText="Delete"
                type="danger"
            />
        </>
    );
};

export default IssueTrackerPage;
