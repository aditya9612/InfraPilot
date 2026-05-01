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
  Filter
} from "lucide-react";

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
];

const IssueTrackerPage = () => {
    const [issueData, setIssueData] = useState<IssueItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [projectId, setProjectId] = useState<number | null>(null);

    // Modal State
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [issueToDelete, setIssueToDelete] = useState<number | null>(null);

    useEffect(() => {
        const resolveProjectId = async () => {
            const userStr = localStorage.getItem("infrapilot_user");
            const user = userStr ? JSON.parse(userStr) : {};
            const pId = user?.project_id || user?.user?.project_id;

            if (pId) {
                setProjectId(Number(pId));
                setFormData(prev => ({ ...prev, project_id: Number(pId) }));
                return;
            }
            setProjectId(1);
        };
        resolveProjectId();
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

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!formData.title.trim()) errs.title = "Required";
        if (!formData.description.trim()) errs.description = "Required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
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
        } catch (error) {
            toast.error("Failed to delete issue");
        }
    };

    const filteredIssues = useMemo(() => {
        return issueData.filter(i => {
            const matchesSearch = i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                i.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "All" || i.status === statusFilter;
            const matchesPriority = priorityFilter === "All" || i.priority === priorityFilter;
            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [issueData, searchTerm, statusFilter, priorityFilter]);

    const stats = {
        total: issueData.length,
        open: issueData.filter(i => i.status === "Open").length,
        high: issueData.filter(i => i.priority === "High").length,
        closed: issueData.filter(i => i.status === "Closed").length,
    };

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
    const inputClasses = (error?: string) => `
        w-full px-4 py-2.5 bg-white border 
        ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} 
        rounded-xl text-sm outline-none transition-all placeholder:text-slate-300
    `;

    return (
        <>
            <Navbar title="Issue Tracker" breadcrumb={["Engineer", "Site Constraints", "Issue Log"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Constraint Management</h1>
                        <p className="text-slate-500 text-sm">Identify, track, and resolve site impediments to maintain momentum.</p>
                    </div>
                    <button
                        onClick={() => { setFormMode("create"); setFormData(INITIAL_FORM_DATA); setIsFormModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Lodge Site Issue
                    </button>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Logs"
                        value={stats.total.toString()}
                        sub="Historical Records"
                        accent="text-slate-800"
                        icon={<Activity className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Pending"
                        value={stats.open.toString()}
                        sub="Action Required"
                        accent="text-rose-500"
                        icon={<AlertTriangle className="w-5 h-5" />}
                    />
                    <StatCard
                        title="High Priority"
                        value={stats.high.toString()}
                        sub="Critical Impact"
                        accent="text-amber-500"
                        icon={<Clock className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Resolved"
                        value={stats.closed.toString()}
                        sub="Success Rate"
                        accent="text-emerald-500"
                        icon={<CheckCircle2 className="w-5 h-5" />}
                    />
                </div>

                {/* ── Filter Bar ───────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
                    <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search issues..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 outline-none">
                                    <option value="All">All Status</option>
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>
                            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 outline-none">
                                <option value="All">All Priority</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="p-20 text-center text-slate-400">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Syncing constraints...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                        <th className="px-6 py-4">Issue Description</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Priority</th>
                                        <th className="px-6 py-4">Reported</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredIssues.length > 0 ? (
                                        filteredIssues.map((issue) => (
                                            <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-800">{issue.title}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{issue.business_id || `ISS-${issue.id}`} • {issue.category}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[issue.status]}`}>
                                                        {issue.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${PRIORITY_COLORS[issue.priority]}`}>
                                                        {issue.priority}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                                    {issue.reported_date}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => setSelectedIssue(issue)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => { setFormMode("edit"); setSelectedIssue(issue); setFormData({ ...issue, assigned_to: issue.assigned_to || "" } as any); setIsFormModalOpen(true); }}
                                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => { setIssueToDelete(issue.id); setIsDeleteModalOpen(true); }}
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                                                No site issues found.
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
                title="Issue Impact Analysis"
                maxWidth="max-w-xl"
            >
                {selectedIssue && (
                    <div className="p-6">
                        <div className={`rounded-[2rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden ${selectedIssue.priority === 'High' ? 'bg-rose-600' : selectedIssue.priority === 'Medium' ? 'bg-amber-600' : 'bg-emerald-600'}`}>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Impediment Documentation</p>
                                <h3 className="text-2xl font-black tracking-tight leading-tight mb-6">{selectedIssue.title}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Issue ID</p>
                                        <p className="text-lg font-black">{selectedIssue.business_id || `ISS-${selectedIssue.id}`}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Status</p>
                                        <p className="text-lg font-black">{selectedIssue.status.toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10">
                            <div>
                                <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-2')}>Impact Narrative</p>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed">
                                    "{selectedIssue.description}"
                                </div>
                            </div>
                            {selectedIssue.resolution && (
                                <div>
                                    <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-2')}>Resolution Strategy</p>
                                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-sm text-emerald-700 font-bold leading-relaxed">
                                        "{selectedIssue.resolution}"
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-1')}>Category</p>
                                    <p className="text-sm font-bold text-slate-800">{selectedIssue.category}</p>
                                </div>
                                <div>
                                    <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-1')}>Priority</p>
                                    <p className="text-sm font-bold text-slate-800">{selectedIssue.priority}</p>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedIssue(null)}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                        >
                            Dismiss analysis
                        </button>
                    </div>
                )}
            </Modal>

            {/* ── Form Modal ────────────────────────────────── */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={formMode === 'create' ? "Lodge Site Issue" : "Modify Constraint Log"}
                maxWidth="max-w-4xl"
                footer={
                    <>
                        <button onClick={() => setIsFormModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button
                            form="issue-form"
                            type="submit"
                            disabled={isSubmitting}
                            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? "Processing..." : formMode === 'create' ? "Lodge Issue" : "Update Log"}
                        </button>
                    </>
                }
            >
                <form id="issue-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Issue Identity</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <label className={labelClasses}>Issue Headline <span className="text-rose-500">*</span></label>
                                <input name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Shortage of Grade-43 Cement" className={inputClasses(errors.title)} />
                            </div>
                            <div>
                                <label className={labelClasses}>Category</label>
                                <select name="category" value={formData.category} onChange={handleInputChange} className={inputClasses()}>
                                    <option value="Material">Material</option>
                                    <option value="Safety">Safety</option>
                                    <option value="Delay">Delay</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>Priority Matrix</label>
                                <select name="priority" value={formData.priority} onChange={handleInputChange} className={inputClasses()}>
                                    <option value="Low">Low Impact</option>
                                    <option value="Medium">Medium Impact</option>
                                    <option value="High">High Impact</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Technical Description</h3>
                        <div>
                            <label className={labelClasses}>Operational Narrative <span className="text-rose-500">*</span></label>
                            <textarea name="description" rows={4} value={formData.description} onChange={handleInputChange} placeholder="Describe the impact on project timeline/scope..." className={`${inputClasses(errors.description)} resize-none`} />
                        </div>
                    </div>

                    {formMode === 'edit' && (
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Resolution Workflow</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClasses}>Workflow Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} className={inputClasses()}>
                                        <option value="Open">Open</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClasses}>Resolution Detail</label>
                                    <input name="resolution" value={formData.resolution} onChange={handleInputChange} placeholder="Brief summary of resolution..." className={inputClasses()} />
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
                title="Delete Issue Log"
                message="Are you sure you want to delete this site issue record? This action cannot be undone."
                confirmText="Delete"
                type="danger"
            />
        </>
    );
};

export default IssueTrackerPage;
