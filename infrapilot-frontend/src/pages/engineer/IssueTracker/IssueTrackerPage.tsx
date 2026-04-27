import React, { useState, useMemo } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface IssueRecord {
    id: string | number;
    title: string;
    category: string;
    description: string;
    reported_date: string;
    priority: string;
    assigned_to: string | number | null;
    status: string;
    resolution: string | null;
    project_id?: number;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const issueHistory: IssueRecord[] = [
    {
        project_id: 1,
        title: "Concrete quality issue",
        category: "Labour",
        description: "Concrete mix failed slump test at site",
        reported_date: "2026-04-10",
        priority: "High",
        id: 2,
        status: "Open",
        assigned_to: null,
        resolution: null
    },
    {
        project_id: 1,
        title: "Sand delivery delay",
        category: "Material",
        description: "Sand supply was delayed by 4HR",
        reported_date: "2026-04-02",
        priority: "High",
        id: 1,
        status: "Open",
        assigned_to: null,
        resolution: null
    }
];

const initialFormData = {
    project_id: 1,
    title: "",
    category: "Material",
    description: "",
    reported_date: new Date().toISOString().split("T")[0],
    priority: "Medium",
    assigned_to: "" as string | number | null,
    status: "Open",
    resolution: "" as string | null,
};


// ─── Main Component ─────────────────────────────────────────────────────────────

const IssueTrackerPage = () => {
    const [issueData, setIssueData] = useState<IssueRecord[]>(issueHistory);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [editId, setEditId] = useState<string | number | null>(null);
    const [selectedIssue, setSelectedIssue] = useState<IssueRecord | null>(null);
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");

    // Summary stats
    const totalIssues = issueData.length;
    const openIssues = issueData.filter(i => i.status === "Open").length;
    const highPriority = issueData.filter(i => i.priority === "High").length;
    const resolutionRate = totalIssues > 0 ? Math.round((issueData.filter(i => i.status === "Closed").length / totalIssues) * 100) : 0;

    // ── CRUD Handlers ────────────────────────────────────────────────────────
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => { const u = { ...prev }; delete u[name]; return u; });
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!formData.title.trim()) errs.title = "Title is required";
        if (!formData.description.trim()) errs.description = "Description is required";
        if (!formData.reported_date) errs.reported_date = "Date is required";
        if (!formData.priority) errs.priority = "Priority is required";
        if (!formData.category) errs.category = "Category is required";
        if (!formData.assigned_to?.toString().trim() && formData.status === "Closed") errs.assigned_to = "Assigned party is required for closure";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleOpenCreate = () => {
        setFormMode("create");
        setFormData(initialFormData);
        setErrors({});
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (issue: IssueRecord) => {
        const { id, project_id, ...rest } = issue;
        setFormMode("edit");
        setEditId(id);
        setFormData({
            project_id: project_id || 1,
            ...rest
        });
        setErrors({});
        setIsFormModalOpen(true);
    };

    const handleDelete = async (id: string | number) => {
        if (window.confirm("Are you sure you want to delete this issue log?")) {
            // Simulated API Call with request body id
            // Response: { "success": true, "message": "Issue deleted successfully" }
            setIssueData(prev => prev.filter(i => String(i.id) !== String(id)));
            toast.success("Successful delete");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please provide all required diagnostic details.");
            return;
        }

        const entryData: IssueRecord = {
            id: formMode === "edit" ? editId! : issueData.length + 1,
            ...formData,
        };

        if (formMode === "edit") {
            setIssueData(prev => prev.map(i => i.id === editId ? entryData : i));
            toast.success("Issue updated successfully");
        } else {
            setIssueData(prev => [entryData, ...prev]);
            toast.success("New site issue lodged!");
        }
        setIsFormModalOpen(false);
    };

    const filteredIssues = useMemo(() => {
        return issueData.filter(issue => {
            const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                issue.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(issue.assigned_to || "").toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "All" || issue.status === statusFilter;
            const matchesPriority = priorityFilter === "All" || issue.priority === priorityFilter;
            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [issueData, searchTerm, statusFilter, priorityFilter]);

    return (
        <>
            <Navbar
                title="Issue / Delay Tracker"
                breadcrumb={["InfraPilot", "Engineer", "Issues"]}
            />

            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Bottleneck Management
                        </p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">
                            Project Constraint Tracker
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Register site issues, design delays, or resource shortages to ensure project momentum.
                        </p>
                    </div>

                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-inter"
                    >
                        <span className="text-lg leading-none font-inter">+</span>
                        Lodge Site Issue
                    </button>
                </div>

                {/* ── Summary Stat Cards (Activity Style) ────────────────────── */}
                <div className="mb-8 font-inter">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 font-inter">
                        Operational Status
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-inter">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Total Logs</p>
                            <p className="text-2xl font-bold text-slate-900 font-inter">{totalIssues}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Reported Issues</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-1 group-hover:w-full h-full bg-rose-500 transition-all duration-500 opacity-10 group-hover:opacity-5" />
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Pending Critical</p>
                            <p className="text-2xl font-bold text-rose-500 font-inter">{openIssues}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Needs Attention</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">High Priority</p>
                            <p className="text-2xl font-bold text-amber-500 font-inter">{highPriority}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Urgent Constraints</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Efficiency</p>
                            <p className="text-2xl font-bold text-emerald-500 font-inter">{resolutionRate}%</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Resolution Rate</p>
                        </div>
                    </div>
                </div>

                {/* ── Filter Bar ───────────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4 mb-8 flex flex-wrap items-center gap-4 font-inter">


                    {/* Icon + Title */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-100">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-base font-bold text-slate-800 whitespace-nowrap">Constraint Filters</span>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-8 bg-slate-100 shrink-0" />

                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search by Title, ID or Assigned..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 font-inter"
                        />
                    </div>

                    {/* Quick Filters */}
                    <div className="flex items-center gap-2 ml-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer font-inter"
                        >
                            <option value="All">All Status</option>
                            <option value="Open">Open</option>
                            <option value="Closed">Closed</option>
                        </select>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer font-inter"
                        >
                            <option value="All">All Priorities</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                </div>

                {/* ── Issue Registry Grid ─────────────────────────────────── */}
                <div className="mb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-inter">
                        {filteredIssues.map((issue) => (
                            <div
                                key={issue.id}
                                className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter flex flex-col"
                            >
                                {/* Header: ID & Status */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ISS-{issue.id}</span>
                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg ${issue.status === "Open" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                                        {issue.status}
                                    </span>
                                </div>

                                {/* Title */}
                                <p className="text-lg font-bold text-slate-900 font-inter leading-tight mb-0.5">{issue.title}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-bold tracking-widest uppercase">{issue.reported_date}</p>

                                {/* Priority Badge */}
                                <div className="mt-3">
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${issue.priority === "High" ? "bg-rose-50 text-rose-600 border-rose-100" :
                                        issue.priority === "Medium" ? "bg-amber-50 text-amber-600 border-amber-100" :
                                            "bg-emerald-50 text-emerald-600 border-emerald-100"
                                        }`}>
                                        {issue.priority} Priority
                                    </span>
                                </div>

                                {/* Description */}
                                <p className="text-xs font-medium text-slate-500 mt-4 line-clamp-2 leading-relaxed italic-none">{issue.description}</p>

                                {/* Footer: Assigned & Actions */}
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                                    <div className="flex flex-col">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Assigned To</p>
                                        <p className="text-xs font-bold text-slate-700">{issue.assigned_to || "Unassigned"}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setSelectedIssue(issue)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="View Analysis"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleOpenEdit(issue)}
                                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                            title="Modify Record"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(issue.id)}
                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                            title="Delete Log"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredIssues.length === 0 && (
                        <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-20 text-center mt-8 font-inter">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <p className="text-blue-900 font-black text-xl mb-2 font-inter uppercase tracking-tight">Clean Operational Desk</p>
                            <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em]">No constraints matched your current filter matrix.</p>
                        </div>
                    )}
                </div>
            </PageTransition>

            {/* ── DETAIL MODAL (Insight View) ────────────────────────────────── */}
            <Modal
                isOpen={!!selectedIssue}
                onClose={() => setSelectedIssue(null)}
                title="Bottleneck Analysis"
                maxWidth="max-w-2xl"
            >
                {selectedIssue && (
                    <div className="bg-white p-8 italic-none font-inter space-y-8">
                        {/* ── Blue Hero Card ────────────────────────────────── */}
                        <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Bottleneck Insight</p>
                                    <h3 className="text-2xl font-black tracking-tight">{selectedIssue.title}</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">Issue Reference: ISS-{selectedIssue.id}</p>
                                </div>
                                <div className="text-right">
                                    <div className={`px-2 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase mb-2 inline-block ${selectedIssue.status === "Open" ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                                        Status: {selectedIssue.status}
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-wider opacity-40">Operational Log</p>
                                </div>
                            </div>
                        </div>

                        {/* ── Constraint Analytics ────────────────────────────── */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Priority Matrix</p>
                                <p className={`text-xl font-black ${selectedIssue.priority === "High" ? "text-rose-600" : "text-blue-600"}`}>{selectedIssue.priority}</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Classification</p>
                                <p className="text-sm font-black text-slate-800 truncate">{selectedIssue.category}</p>
                            </div>
                        </div>

                        {/* ── Technical Breakdown ────────────────────────────── */}
                        <div className="space-y-6">
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Constraint Narration</p>
                                <p className="text-xs font-bold text-slate-600 leading-relaxed italic-none">{selectedIssue.description}</p>
                            </div>

                            <div className={`rounded-2xl p-5 border ${selectedIssue.status === "Closed" ? "bg-emerald-50/50 border-emerald-100" : "bg-amber-50/50 border-amber-100"}`}>
                                <p className={`text-[10px] font-black ${selectedIssue.status === "Closed" ? "text-emerald-600/60" : "text-amber-600/60"} uppercase tracking-widest mb-2 font-inter`}>Resolution Outcome</p>
                                <p className={`text-sm font-black ${selectedIssue.status === "Closed" ? "text-emerald-700" : "text-amber-700"} leading-relaxed italic-none tracking-tight`}>
                                    {selectedIssue.resolution || "Problem diagnostics active. Awaiting tactical resolution protocol."}
                                </p>
                            </div>

                            <div className="flex items-center justify-between py-4 border-t border-slate-100 px-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Party</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-600 uppercase">
                                        {String(selectedIssue.assigned_to || "??").substring(0, 2)}
                                    </div>
                                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{selectedIssue.assigned_to || "No Lead Assigned"}</span>
                                </div>
                            </div>
                        </div>

                        {/* ── Action Footer ─────────────────────────────────── */}
                        <div className="flex items-center justify-end gap-3 pt-4 font-inter">
                            <button
                                onClick={() => setSelectedIssue(null)}
                                className="px-6 py-2.5 text-[10px] font-black text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-all"
                            >
                                Dismiss Insight
                            </button>
                            <button
                                onClick={() => {
                                    handleOpenEdit(selectedIssue);
                                    setSelectedIssue(null);
                                }}
                                className="px-8 py-2.5 bg-primary text-white text-[13px] font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                Modify Registry
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── FORM MODAL (Diagnostic Report) ─────────────────────────── */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setErrors({}); }}
                title={formMode === "create" ? "Lodge Site Constraint" : "Modify Constraint Log"}
                maxWidth="max-w-4xl"
            >
                <div className="bg-primary px-8 py-5 flex items-center justify-between border-b border-white/10 shadow-lg shadow-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white font-inter tracking-tight uppercase leading-none">
                                {formMode === "create" ? "Lodge Site Issue" : "Update Site Registry"}
                            </h2>
                            <p className="text-[10px] text-blue-100 font-bold uppercase tracking-[0.2em] mt-1 leading-none">Constraint Analysis Protocol</p>
                        </div>
                    </div>
                    <button onClick={() => { setIsFormModalOpen(false); setErrors({}); }} className="text-blue-100 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="bg-white p-8 italic-none font-inter text-inter">
                    <form id="issue-form" onSubmit={handleSubmit} className="p-8 space-y-12 text-inter">
                        {/* Section 1: Issue Identity */}
                        <section className="font-inter">
                            <div className="flex items-center gap-4 mb-8 font-inter">
                                <h3 className="text-[15px] font-bold text-slate-800 font-inter underline decoration-blue-500 decoration-2 underline-offset-8 uppercase tracking-tight">Issue Identity</h3>
                            </div>
                            <div className="space-y-6">
                                <div className="flex flex-col gap-1.5 font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">Issue Headline <span className="text-rose-500">*</span></label>
                                    <input
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="Succinct title of the Project Bottleneck"
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter ${errors.title ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.title && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.title}</p>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
                                    <div className="flex flex-col gap-1.5 font-inter">
                                        <label className="text-[13px] font-bold text-slate-700 font-inter">Classification Category <span className="text-rose-500">*</span></label>
                                        <div className="relative font-inter">
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer pr-10 font-inter ${errors.category ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                            >
                                                <option value="Material">Material Delay / Shortage</option>
                                                <option value="Labor">Labor Disruption / Conflict</option>
                                                <option value="Design">Architectural / Design Clarification</option>
                                            </select>
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                            </span>
                                        </div>
                                        {errors.category && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.category}</p>}
                                    </div>
                                    <div className="flex flex-col gap-1.5 font-inter">
                                        <label className="text-[13px] font-bold text-slate-700 font-inter">Priority Matrix <span className="text-rose-500">*</span></label>
                                        <div className="relative font-inter">
                                            <select
                                                name="priority"
                                                value={formData.priority}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer pr-10 font-inter ${errors.priority ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                            >
                                                <option value="Low">Low Priority</option>
                                                <option value="Medium">Medium Priority</option>
                                                <option value="High">Critical Priority</option>
                                            </select>
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                            </span>
                                        </div>
                                        {errors.priority && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.priority}</p>}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Narrative Details */}
                        <section className="font-inter">
                            <div className="flex items-center gap-4 mb-8 font-inter">
                                <h3 className="text-[15px] font-bold text-slate-800 font-inter underline decoration-amber-500 decoration-2 underline-offset-8 uppercase tracking-tight">Narrative Details</h3>
                            </div>
                            <div className="space-y-6">
                                <div className="flex flex-col gap-1.5 font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">Constraint Narration <span className="text-rose-500">*</span></label>
                                    <textarea
                                        name="description"
                                        rows={3}
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Technical narration of the reported bottleneck..."
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all resize-none font-inter leading-relaxed ${errors.description ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.description && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.description}</p>}
                                </div>
                                <div className="flex flex-col gap-1.5 font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">Observed Date <span className="text-rose-500">*</span></label>
                                    <input
                                        name="reported_date"
                                        type="date"
                                        value={formData.reported_date}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter ${errors.reported_date ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.reported_date && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.reported_date}</p>}
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Response Matrix */}
                        <section className="font-inter">
                            <div className="flex items-center gap-4 mb-8 font-inter">
                                <h3 className="text-[15px] font-bold text-slate-800 font-inter underline decoration-emerald-500 decoration-2 underline-offset-8 uppercase tracking-tight">Response Matrix</h3>
                            </div>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
                                    <div className="flex flex-col gap-1.5 font-inter">
                                        <label className="text-[13px] font-bold text-slate-700 font-inter">Assigned Party <span className="text-rose-500">*</span></label>
                                        <input
                                            name="assigned_to"
                                            value={formData.assigned_to || ""}
                                            onChange={handleInputChange}
                                            placeholder="Who needs to act?"
                                            className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter ${errors.assigned_to ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                        />
                                        {errors.assigned_to && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.assigned_to}</p>}
                                    </div>
                                    <div className="flex flex-col gap-1.5 font-inter">
                                        <label className="text-[13px] font-bold text-slate-700 font-inter">Current Status</label>
                                        <div className="relative font-inter">
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:outline-none appearance-none cursor-pointer pr-10 font-inter"
                                            >
                                                <option value="Open">Registry Open</option>
                                                <option value="Closed">Resolved & Closed</option>
                                            </select>
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5 font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">Resolution Outcome Notes</label>
                                    <textarea
                                        name="resolution"
                                        rows={2}
                                        value={formData.resolution || ""}
                                        onChange={handleInputChange}
                                        placeholder="Final resolution details or closure outcome..."
                                        className="w-full px-4 py-3 bg-emerald-50/20 border border-emerald-100 rounded-lg text-[13px] text-emerald-800 focus:outline-none transition-all resize-none font-inter leading-relaxed italic-none"
                                    />
                                </div>
                            </div>
                        </section>
                    </form>
                </div>

                <div className="bg-white px-8 py-6 border-t border-slate-100 flex items-center justify-between font-inter">
                    <button
                        type="button"
                        onClick={() => { setIsFormModalOpen(false); setErrors({}); }}
                        className="text-[11px] font-bold text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-all font-inter"
                    >
                        Discard Analysis
                    </button>
                    <button
                        type="submit"
                        form="issue-form"
                        className="px-8 py-3 bg-primary text-white text-[13px] font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95 font-inter"
                    >
                        {formMode === "create" ? "Lodge Site Issue" : "Commit Updates"}
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default IssueTrackerPage;
