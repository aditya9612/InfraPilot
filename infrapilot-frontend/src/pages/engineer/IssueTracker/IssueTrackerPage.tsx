import React, { useState, useMemo, useEffect, useCallback } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import {
    AlertTriangle,
    Clock,
    CheckCircle2,
    Search,
    Plus,
    Edit2,
    Trash2,
    Eye,
    Activity,
    Filter,
    Mail,
    FileText,
    RotateCcw,
    Briefcase
} from "lucide-react";

import { issueService } from "../../../services/issueService";
import type { IssueItem } from "../../../types/issue";


const PRIORITY_COLORS: Record<string, string> = {
    High: "bg-rose-50 text-rose-600 border-rose-100",
    Medium: "bg-amber-50 text-amber-600 border-amber-100",
    Low: "bg-emerald-50 text-emerald-600 border-emerald-100",
};

const STATUS_COLORS: Record<string, string> = {
    Open: "bg-rose-50 text-rose-600 border-rose-100",
    Closed: "bg-emerald-50 text-emerald-600 border-emerald-100",
    "In Progress": "bg-blue-50 text-blue-600 border-blue-100",
};

const INITIAL_FORM_DATA = {
    project_id: 36,
    title: "",
    category: "Material",
    description: "",
    reported_date: new Date().toISOString().split("T")[0],
    priority: "Medium",
    assigned_to: "" as any,
    status: "Open",
    resolution: "",
};

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
];

const IssueTrackerPage = () => {
    const [issueData, setIssueData] = useState<IssueItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [projectId, setProjectId] = useState<number | null>(null);

    // Interactive StatCard Filter
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Pending" | "High" | "Resolved">("All");

    // Modal State
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [issueToDelete, setIssueToDelete] = useState<number | null>(null);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) newErrors.title = "Required";
        if (!formData.category) newErrors.category = "Required";
        if (!formData.priority) newErrors.priority = "Required";
        if (!formData.description.trim()) newErrors.description = "Required";
        if (!formData.reported_date) newErrors.reported_date = "Required";
        if (formMode === 'edit') {
            if (!formData.status) newErrors.status = "Required";
            if (!formData.resolution.trim()) newErrors.resolution = "Required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        const userStr = localStorage.getItem("infrapilot_user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const pId = user?.project_id || user?.user?.project_id;
                if (pId) {
                    const resolvedId = Number(pId);
                    setProjectId(resolvedId);
                    setFormData(prev => ({ ...prev, project_id: resolvedId }));
                } else {
                    setProjectId(36);
                    setFormData(prev => ({ ...prev, project_id: 36 }));
                }
            } catch (e) {
                console.error("Failed to resolve project ID", e);
                setProjectId(36);
            }
        }
    }, []);

    const fetchIssues = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            let apiIssues: IssueItem[] = [];
            try {
                const response = await issueService.listIssuesByProject(projectId);
                apiIssues = response.items;
            } catch (err) {
                console.warn("API unavailable, using demo data.");
            }

            if (apiIssues.length === 0) {
                setIssueData(DEMO_ISSUES);
            } else {
                setIssueData(apiIssues);
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!projectId || !formData.project_id) {
            toast.error("Critical Error: Active project not detected.");
            return;
        }

        if (!validate()) {
            toast.error("Please correct the errors in the form");
            return;
        }
        setIsSubmitting(true);
        try {
            if (formMode === "create") {
                await issueService.createIssue(formData as any);
                toast.success("Issue lodged successfully!");
            } else if (selectedIssue) {
                await issueService.updateIssue(selectedIssue.id, formData as any);
                toast.success("Issue updated successfully!");
            }
            setIsFormModalOpen(false);
            fetchIssues();
        } catch (error: any) {
            toast.error("Failed to save issue");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!issueToDelete) return;
        try {
            await issueService.deleteIssue(issueToDelete);
            toast.success("Issue deleted successfully");
            setIsDeleteModalOpen(false);
            fetchIssues();
        } catch (error: any) {
            toast.error("Failed to delete issue");
        }
    };

    const filteredIssues = useMemo(() => {
        let data = issueData;

        // Apply StatCard Filter
        if (activeStatFilter === "Pending") {
            data = data.filter(i => i.status === "Open" || i.status === "In Progress");
        } else if (activeStatFilter === "High") {
            data = data.filter(i => i.priority === "High");
        } else if (activeStatFilter === "Resolved") {
            data = data.filter(i => i.status === "Closed" || i.status === "Resolved");
        }

        return data.filter(i => {
            const matchesSearch = i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                i.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "All" || i.status === statusFilter;
            const matchesPriority = priorityFilter === "All" || i.priority === priorityFilter;
            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [issueData, searchTerm, statusFilter, priorityFilter, activeStatFilter]);

    const stats = {
        total: issueData.length,
        open: issueData.filter(i => i.status === "Open" || i.status === "In Progress").length,
        high: issueData.filter(i => i.priority === "High").length,
        closed: issueData.filter(i => i.status === "Closed" || i.status === "Resolved").length,
    };

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";
    const inputClasses = (error?: string) => `
        w-full px-4 py-2.5 bg-slate-50 border 
        ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} 
        rounded-xl text-sm font-bold outline-none transition-all placeholder:text-slate-400 font-inter
    `;

    return (
        <>
            <Navbar title="Issue Tracker" breadcrumb={["Engineer", "Site Constraints", "Issue Log"]} />

            <PageTransition className="p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter flex flex-col">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
                    <div className="font-inter">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">Constraint Management Vault</h1>
                        <p className="text-slate-500 text-sm font-inter">
                            Identify, track, and resolve site impediments to ensure project flow.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setFormMode("create");
                            setFormData({ ...INITIAL_FORM_DATA, project_id: projectId || 0 });
                            setErrors({});
                            setIsFormModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
                    >
                        <Plus className="w-4 h-4" />
                        Log Issue
                    </button>
                </div>

                {/* ── Interactive Stats ───────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-inter">
                    <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Total Logs"
                            value={stats.total.toString()}
                            sub="Project Archive"
                            accent="text-slate-800" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Pending")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Pending" ? "ring-2 ring-rose-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Pending"
                            value={stats.open.toString()}
                            sub="Action Required"
                            accent="text-rose-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("High")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "High" ? "ring-2 ring-amber-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="High Priority"
                            value={stats.high.toString()}
                            sub="Critical Impact"
                            accent="text-amber-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Resolved")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Resolved" ? "ring-2 ring-emerald-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Resolved"
                            value={stats.closed.toString()}
                            sub="Resolution Rate"
                            accent="text-emerald-500" />
                    </div>
                </div>

                {/* ── Registry Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
                    <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-white font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by title or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                            />
                        </div>
                        <div className="flex items-center gap-3 font-inter">
                            <div className="flex items-center gap-2 font-inter">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer shadow-sm font-inter">
                                    <option value="All">All Status</option>
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>
                            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer shadow-sm font-inter">
                                <option value="All">All Priority</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                            {activeStatFilter !== "All" && (
                                <button onClick={() => setActiveStatFilter("All")} className="p-2 text-slate-400 hover:text-rose-500 transition-colors font-inter">
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        {isLoading ? (
                            <div className="p-20 text-center font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4 font-inter" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">Syncing issue vault...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left font-inter min-w-[1200px]">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                        <th className="px-6 py-4 font-inter">Issue Identifier</th>
                                        <th className="px-6 py-4 font-inter">Status Profile</th>
                                        <th className="px-6 py-4 font-inter">Priority Level</th>
                                        <th className="px-6 py-4 font-inter">Timeline Audit</th>
                                        <th className="px-6 py-4 text-right font-inter">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-inter">
                                    {filteredIssues.length > 0 ? (
                                        filteredIssues.map((issue) => (
                                            <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                                <td className="px-6 py-4 font-inter">
                                                    <div className="flex flex-col font-inter">
                                                        <span className="text-sm font-bold text-slate-800 font-inter">{issue.title}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-inter">#{issue.business_id || `ISS-${issue.id}`} • {issue.category}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-inter">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border font-inter ${STATUS_COLORS[issue.status] || 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                        {issue.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-inter">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border font-inter ${PRIORITY_COLORS[issue.priority]}`}>
                                                        {issue.priority}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-inter">
                                                    <div className="flex flex-col font-inter">
                                                        <span className="text-xs font-bold text-slate-500 font-inter">{issue.reported_date}</span>
                                                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest font-inter">Reported</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-inter">
                                                    <div className="flex items-center justify-end gap-2 font-inter">
                                                        <button
                                                            onClick={() => { setSelectedIssue(issue); }}
                                                            className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 font-inter"
                                                            title="View Intelligence"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => { setFormMode("edit"); setFormData({ ...issue, assigned_to: issue.assigned_to || "" } as any); setErrors({}); setIsFormModalOpen(true); }}
                                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
                                                            title="Modify Record"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => { setIssueToDelete(issue.id); setIsDeleteModalOpen(true); }}
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-inter"
                                                            title="Discard Log"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter">
                                                No site issues found in the project ledger matching the criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </PageTransition>

            {/* ── Detail Modal ────────────────────────────────── */}
            <Modal
                isOpen={!!selectedIssue && !isFormModalOpen}
                onClose={() => setSelectedIssue(null)}
                title="Constraint Intelligence Insight"
                maxWidth="max-w-xl"
            >
                {selectedIssue && (
                    <div className="p-6 font-inter">
                        {/* ── Profile Style Header ────────────────── */}
                        <div className="bg-primary rounded-xl p-8 mb-8 text-white shadow-2xl relative overflow-hidden font-inter">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                            <div className="relative z-10 flex items-center gap-8 font-inter">
                                <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20 shadow-inner font-inter relative">
                                    <span className="text-4xl font-bold font-inter">{selectedIssue.title.charAt(0)}</span>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-slate-800 rounded-full animate-pulse" />
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-bold tracking-tight font-inter truncate max-w-[200px]">{selectedIssue.title}</h3>
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest ${selectedIssue.status === 'Closed' ? 'bg-emerald-500/20 text-emerald-100' : 'bg-amber-500/20 text-amber-100'}`}>
                                            {selectedIssue.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[10px] font-bold font-inter uppercase tracking-widest">issue.ref-#{selectedIssue.id}</span>
                                    </div>
                                    <div className="px-4 py-1.5 bg-white/15 rounded-xl border border-white/10 inline-block font-inter shadow-sm">
                                        <span className="text-[9px] font-bold uppercase tracking-widest font-inter">PRIORITY: {selectedIssue.priority}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            {/* Operational Intelligence style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-xl font-inter border border-blue-100 shadow-sm">
                                        <Briefcase className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] font-inter">Issue Parameters</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-8 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Category Profile</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter uppercase tracking-widest">{selectedIssue.category}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Urgency Level</p>
                                        <p className="text-sm font-bold text-rose-500 font-inter uppercase tracking-widest">{selectedIssue.priority}</p>
                                    </div>
                                    <div className="font-inter col-span-2">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-inter ml-1">Narrative Insight</p>
                                        <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold text-slate-600 leading-relaxed font-inter shadow-inner">
                                            "{selectedIssue.description}"
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Assignments style section */}
                            {selectedIssue.resolution && (
                                <div className="font-inter">
                                    <div className="flex items-center gap-2 mb-6 font-inter">
                                        <div className="p-2 bg-emerald-50 rounded-xl font-inter border border-emerald-100 shadow-sm">
                                            <FileText className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] font-inter">Resolution Strategy</p>
                                    </div>
                                    <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100 text-xs font-bold text-emerald-800 font-inter leading-relaxed shadow-inner uppercase tracking-widest">
                                        {selectedIssue.resolution}
                                    </div>
                                </div>
                            )}

                            {/* Audit Trail style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-xl font-inter border border-blue-100 shadow-sm">
                                        <Activity className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] font-inter">Sequence Audit</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-8 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Initial Report</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter tracking-widest">{selectedIssue.reported_date}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Reference Hash</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter tracking-widest">ISS-#{selectedIssue.id}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedIssue(null)}
                            className="w-full py-5 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 font-inter mb-2"
                        >
                            Dismiss Analysis
                        </button>
                    </div>
                )}
            </Modal>

            {/* ── Form Modal ────────────────────────────────── */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={formMode === 'create' ? "Initiate Constraint Log" : "Modify Intelligence Sequence"}
                maxWidth="max-w-4xl"
                footer={
                    <div className="flex items-center justify-end gap-3 px-6 pb-6 font-inter">
                        <button onClick={() => setIsFormModalOpen(false)} className="flex-1 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all font-inter">
                            Cancel
                        </button>
                        <button
                            form="issue-form"
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 font-inter"
                        >
                            {isSubmitting ? "Syncing..." : formMode === 'create' ? "Commit Log" : "Push Update"}
                        </button>
                    </div>
                }
            >
                <form id="issue-form" onSubmit={handleSubmit} className="p-6 space-y-8 font-inter">
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
                            <Activity className="w-4 h-4 text-primary" />
                            Issue Intelligence Profile
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
                            <div className="md:col-span-2 font-inter">
                                <label className={labelClasses}>Descriptive Headline <span className="text-rose-500">*</span></label>
                                <input name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Critical Failure in Excavation Equipment" className={inputClasses(errors.title)} />
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Report Sequence (Date) <span className="text-rose-500">*</span></label>
                                <input name="reported_date" type="date" value={formData.reported_date} onChange={handleInputChange} className={inputClasses(errors.reported_date)} />
                                {errors.reported_date && <p className="mt-1.5 text-[9px] text-rose-500 font-bold uppercase tracking-widest ml-1">{errors.reported_date}</p>}
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Category Domain <span className="text-rose-500">*</span></label>
                                <select name="category" value={formData.category} onChange={handleInputChange} className={inputClasses(errors.category)}>
                                    <option value="Material">Material</option>
                                    <option value="Safety">Safety</option>
                                    <option value="Delay">Delay</option>
                                </select>
                                {errors.category && <p className="mt-1.5 text-[9px] text-rose-500 font-bold uppercase tracking-widest ml-1">{errors.category}</p>}
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Impact Matrix (Priority) <span className="text-rose-500">*</span></label>
                                <select name="priority" value={formData.priority} onChange={handleInputChange} className={inputClasses(errors.priority)}>
                                    <option value="Low">Low Impact</option>
                                    <option value="Medium">Medium Impact</option>
                                    <option value="High">High Impact</option>
                                </select>
                                {errors.priority && <p className="mt-1.5 text-[9px] text-rose-500 font-bold uppercase tracking-widest ml-1">{errors.priority}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
                            <FileText className="w-4 h-4 text-primary" />
                            Technical Narrative
                        </h3>
                        <div className="font-inter">
                            <label className={labelClasses}>Detailed Observation <span className="text-rose-500">*</span></label>
                            <textarea name="description" rows={4} value={formData.description} onChange={handleInputChange} placeholder="Describe the constraints impacting site flow..." className={`${inputClasses(errors.description)} resize-none font-bold`} />
                        </div>
                    </div>

                    {formMode === 'edit' && (
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm font-inter">
                            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                Remediation Workflow
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
                                <div className="font-inter">
                                    <label className={labelClasses}>Sequence Status <span className="text-rose-500">*</span></label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} className={inputClasses(errors.status)}>
                                        <option value="Open">Open</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                    {errors.status && <p className="mt-1.5 text-[9px] text-rose-500 font-bold uppercase tracking-widest ml-1">{errors.status}</p>}
                                </div>
                                <div className="font-inter">
                                    <label className={labelClasses}>Remediation summary <span className="text-rose-500">*</span></label>
                                    <input name="resolution" value={formData.resolution} onChange={handleInputChange} placeholder="How was this constraint resolved?" className={inputClasses(errors.resolution)} />
                                    {errors.resolution && <p className="mt-1.5 text-[9px] text-rose-500 font-bold uppercase tracking-widest ml-1">{errors.resolution}</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Discard Log Intelligence"
                message="Are you sure you want to discard this constraint record from the project vault? This action is permanent."
                confirmText="Discard Log"
                type="danger"
            />
        </>
    );
};

export default IssueTrackerPage;
