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
    Activity,
    Filter,
    Mail,
    RotateCcw,
    Briefcase,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

import { issueService } from "../../../services/issueService";
import { projectService } from "../../../services/projectService";
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
    project_id: 92,
    title: "",
    category: "Material",
    description: "",
    reported_date: new Date().toISOString().split("T")[0],
    priority: "Medium",
    assigned_to: "" as any,
    status: "Open",
    resolution: "",
};



const IssueTrackerPage = () => {
    const [issueData, setIssueData] = useState<IssueItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [projectId, setProjectId] = useState<number | null>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Interactive StatCard Filter
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Pending" | "High" | "Resolved">("All");

    // Modal State
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) newErrors.title = "Required";
        if (!formData.category) newErrors.category = "Required";
        if (!formData.priority) newErrors.priority = "Required";
        if (!formData.description.trim()) newErrors.description = "Required";
        if (!formData.reported_date) newErrors.reported_date = "Required";


        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        const initializeProject = async () => {
            try {
                const res = await projectService.getProjects(100, 0);
                const list = Array.isArray(res) ? res : (res.items || res.data || []);
                setProjects(list);
            } catch (err) {
                console.error("Failed to fetch projects", err);
            }
            try {
                const userStr = localStorage.getItem("infrapilot_user");
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const pId = user?.project_id || user?.user?.project_id;
                    if (pId) {
                        const resolvedId = Number(pId);
                        setProjectId(resolvedId);
                        setFormData(prev => ({ ...prev, project_id: resolvedId }));
                        return;
                    }
                }
            } catch (e) { console.error(e); }
            setProjectId(92);
            setFormData(prev => ({ ...prev, project_id: 92 }));
        };
        initializeProject();
    }, []);

    const fetchIssues = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            const response = await issueService.getIssues({ 
                project_id: projectId,
                status: statusFilter,
                priority: priorityFilter,
                search: searchTerm,
                limit: 1000
            });
            setIssueData(response.items || []);
        } catch (error) {
            console.error("Fetch Issues Failure:", error);
            toast.error("Failed to sync project constraints");
        } finally {
            setIsLoading(false);
        }
    }, [projectId, statusFilter, priorityFilter, searchTerm]);

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
            }
            setIsFormModalOpen(false);
            fetchIssues();
        } catch (error: any) {
            toast.error("Failed to save issue");
        } finally {
            setIsSubmitting(false);
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

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, priorityFilter, activeStatFilter]);

    const paginatedIssues = filteredIssues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

            <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter flex flex-col pb-8">
                {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8 font-inter">
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

                {/* â”€â”€ Interactive Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8 font-inter">
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

                {/* â”€â”€ Registry Container â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                        <div className="flex flex-wrap items-center gap-3 font-inter">
                            <div className="flex items-center gap-2 font-inter">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer shadow-sm font-inter">
                                    <option value="All">All Status</option>
                                    <option value="Open">Open</option>
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
                                    {paginatedIssues.length > 0 ? (
                                        paginatedIssues.map((issue) => (
                                            <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                                <td className="px-6 py-4 font-inter">
                                                    <div className="flex flex-col font-inter">
                                                        <span className="text-sm font-bold text-slate-800 font-inter">{issue.title}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-inter">{issue.category}</span>
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
                                                            onClick={async () => {
                                                                const loadToast = toast.loading("Syncing constraint intelligence...");
                                                                try {
                                                                    const fullIssue = await issueService.getIssue(issue.id);
                                                                    setSelectedIssue(fullIssue);
                                                                    toast.success("Intelligence profile loaded!", { id: loadToast });
                                                                } catch (e) {
                                                                    toast.error("Failed to load constraint record", { id: loadToast });
                                                                }
                                                            }}
                                                            className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 font-inter"
                                                            title="View Intelligence"
                                                        >
                                                            <Eye className="w-4 h-4" />
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

                    {/* Pagination */}
                    {!isLoading && filteredIssues.length > 0 && (
                        <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between bg-white sticky left-0 font-inter">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                PAGE {currentPage} OF {Math.max(1, Math.ceil(filteredIssues.length / itemsPerPage))}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1 text-slate-400 hover:text-primary disabled:opacity-30 transition-colors"
                                    title="Previous Page"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm shadow-primary/20">
                                    {currentPage}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(Math.max(1, Math.ceil(filteredIssues.length / itemsPerPage)), prev + 1))}
                                    disabled={currentPage === Math.max(1, Math.ceil(filteredIssues.length / itemsPerPage))}
                                    className="p-1 text-slate-400 hover:text-primary disabled:opacity-30 transition-colors"
                                    title="Next Page"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </PageTransition>

            {/* â”€â”€ Detail Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <Modal
                isOpen={!!selectedIssue && !isFormModalOpen}
                onClose={() => setSelectedIssue(null)}
                title="Constraint Intelligence Insight"
                maxWidth="max-w-xl"
            >
                {selectedIssue && (
                    <div className="p-6 font-inter">
                        {/* â”€â”€ Profile Style Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-xl font-inter border border-blue-100 shadow-sm">
                                        <Briefcase className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] font-inter">Issue Parameters</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 font-inter">
                                    <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Category</p><p className="text-sm font-bold text-slate-800 uppercase tracking-widest">{selectedIssue.category}</p></div>
                                    <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Priority</p><p className="text-sm font-bold text-rose-500 uppercase tracking-widest">{selectedIssue.priority}</p></div>
                                    <div className="col-span-2">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</p>
                                        <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold text-slate-600 leading-relaxed shadow-inner">"{selectedIssue.description}"</div>
                                    </div>
                                </div>
                            </div>
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-xl border border-blue-100 shadow-sm"><Activity className="w-4 h-4 text-primary" /></div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Sequence Audit</p>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Reported</p><p className="text-sm font-bold text-slate-800">{selectedIssue.reported_date}</p></div>
                                    <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Reference</p><p className="text-sm font-bold text-slate-800">ISS-#{selectedIssue.id}</p></div>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setSelectedIssue(null)} className="w-full py-5 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 font-inter mb-2">
                            Dismiss
                        </button>
                    </div>
                )}
            </Modal>

            {/* ─── Form Modal (DSR Style) ────────────────────────── */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={formMode === 'create' ? "Log Issue" : "Edit Issue"}
                maxWidth="max-w-4xl"
                footer={
                    <>
                        <button type="button" onClick={() => setIsFormModalOpen(false)} disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50">
                            Cancel
                        </button>
                        <button form="issue-form" type="submit" disabled={isSubmitting} className={`px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}>
                            {isSubmitting ? "Saving..." : formMode === 'create' ? "Log Issue" : "Update Issue"}
                        </button>
                    </>
                }
            >
                <form id="issue-form" onSubmit={handleSubmit} noValidate className="space-y-5">
                    {/* Project */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Project</h3>
                        <div>
                            <label className={labelClasses}>Project <span className="text-rose-500">*</span></label>
                            <select name="project_id" value={formData.project_id} onChange={(e) => setFormData(prev => ({ ...prev, project_id: Number(e.target.value) }))} className={inputClasses(errors.project_id)}>
                                <option value="">-- Select Project --</option>
                                {projects.map((p: any) => (
                                    <option key={p.id || p.project_id} value={p.id || p.project_id}>
                                        {p.name || p.project_name || `Project #${p.id || p.project_id}`}
                                    </option>
                                ))}
                            </select>
                            {errors.project_id && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.project_id}</p>}
                        </div>
                    </div>

                    {/* Issue Details */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Issue Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className={labelClasses}>Title <span className="text-rose-500">*</span></label>
                                <input name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Sand delivery delay" className={inputClasses(errors.title)} />
                                {errors.title && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.title}</p>}
                            </div>
                            <div>
                                <label className={labelClasses}>Category <span className="text-rose-500">*</span></label>
                                <select name="category" value={formData.category} onChange={handleInputChange} className={inputClasses(errors.category)}>
                                    <option value="Material">Material</option>
                                    <option value="Safety">Safety</option>
                                    <option value="Delay">Delay</option>
                                    <option value="Equipment">Equipment</option>
                                    <option value="Labour">Labour</option>
                                </select>
                                {errors.category && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.category}</p>}
                            </div>
                            <div>
                                <label className={labelClasses}>Priority <span className="text-rose-500">*</span></label>
                                <select name="priority" value={formData.priority} onChange={handleInputChange} className={inputClasses(errors.priority)}>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                                {errors.priority && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.priority}</p>}
                            </div>
                            <div>
                                <label className={labelClasses}>Reported Date <span className="text-rose-500">*</span></label>
                                <input name="reported_date" type="date" value={formData.reported_date} onChange={handleInputChange} className={inputClasses(errors.reported_date)} />
                                {errors.reported_date && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.reported_date}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Description</h3>
                        <div>
                            <label className={labelClasses}>Description <span className="text-rose-500">*</span></label>
                            <textarea name="description" rows={4} value={formData.description} onChange={handleInputChange} placeholder="Describe the issue in detail..." className={`${inputClasses(errors.description)} resize-none`} />
                            {errors.description && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.description}</p>}
                        </div>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default IssueTrackerPage;


