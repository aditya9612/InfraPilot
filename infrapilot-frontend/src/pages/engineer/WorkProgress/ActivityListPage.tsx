import React, { useState, useMemo, useRef } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Activity {
    id: number;
    activity_name: string;
    boq_code: string;
    planned_quantity: number;
    today_progress: number;
    total_completed: number;
    remaining_quantity: number;
    percent_completion: number;
    start_date: string;
    end_date: string;
    status: "On Track" | "Delay";
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockActivities: Activity[] = [
    {
        id: 1,
        activity_name: "Excavation",
        boq_code: "BOQ-STR-001",
        planned_quantity: 5000,
        today_progress: 120,
        total_completed: 3800,
        remaining_quantity: 1200,
        percent_completion: 76,
        start_date: "2026-03-01",
        end_date: "2026-04-20",
        status: "On Track",
    },
    {
        id: 2,
        activity_name: "RCC Work",
        boq_code: "BOQ-STR-002",
        planned_quantity: 1500,
        today_progress: 45,
        total_completed: 600,
        remaining_quantity: 900,
        percent_completion: 40,
        start_date: "2026-03-15",
        end_date: "2026-05-30",
        status: "Delay",
    },
    {
        id: 3,
        activity_name: "Brickwork",
        boq_code: "BOQ-ARC-005",
        planned_quantity: 2500,
        today_progress: 0,
        total_completed: 0,
        remaining_quantity: 2500,
        percent_completion: 0,
        start_date: "2026-05-01",
        end_date: "2026-06-15",
        status: "On Track",
    },
];

const initialFormData = {
    activity_name: "",
    boq_code: "",
    planned_quantity: "",
    today_progress: "0",
    total_completed: "0",
    remaining_quantity: "0",
    percent_completion: "0",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    status: "On Track" as "On Track" | "Delay",
};



// ─── Main Component ────────────────────────────────────────────────────────────

const ActivityListPage = () => {
    const [activities, setActivities] = useState<Activity[]>(mockActivities);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [formData, setFormData] = useState(initialFormData);
    const [editId, setEditId] = useState<number | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [viewMode, setViewMode] = useState<"List" | "Gantt">("List");

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // ── CRUD Handlers ────────────────────────────────────────────────────────
    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            toast.loading("Parsing activity data from Excel...", { duration: 2000 });
            setTimeout(() => {
                toast.success(`Successfully imported 5 activities from ${file.name}`);
                e.target.value = ""; // reset
            }, 2000);
        }
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => { const u = { ...prev }; delete u[name]; return u; });
    };

    const validateForm = () => {
        const errs: Record<string, string> = {};
        if (!formData.activity_name.trim()) errs.activity_name = "Required";
        if (!formData.boq_code.trim()) errs.boq_code = "Required";
        if (!formData.planned_quantity) errs.planned_quantity = "Required";
        if (!formData.end_date) errs.end_date = "Required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleOpenCreate = () => {
        setFormMode("create");
        setFormData(initialFormData);
        setErrors({});
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (activity: Activity) => {
        setFormMode("edit");
        setEditId(activity.id);
        setFormData({
            activity_name: activity.activity_name,
            boq_code: activity.boq_code,
            planned_quantity: activity.planned_quantity.toString(),
            today_progress: activity.today_progress.toString(),
            total_completed: activity.total_completed.toString(),
            remaining_quantity: activity.remaining_quantity.toString(),
            percent_completion: activity.percent_completion.toString(),
            start_date: activity.start_date,
            end_date: activity.end_date,
            status: activity.status,
        });
        setErrors({});
        setIsFormModalOpen(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Are you sure you want to delete this activity?")) {
            setActivities(prev => prev.filter(a => a.id !== id));
            toast.success("Activity deleted successfully");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all required fields");
            return;
        }

        const activityData: Activity = {
            id: formMode === "edit" ? editId! : Math.max(0, ...activities.map(a => a.id)) + 1,
            activity_name: formData.activity_name,
            boq_code: formData.boq_code,
            planned_quantity: Number(formData.planned_quantity),
            today_progress: Number(formData.today_progress),
            total_completed: Number(formData.total_completed),
            remaining_quantity: Number(formData.remaining_quantity),
            percent_completion: Number(formData.percent_completion),
            start_date: formData.start_date,
            end_date: formData.end_date,
            status: formData.status,
        };

        if (formMode === "edit") {
            setActivities(prev => prev.map(a => a.id === editId ? activityData : a));
            toast.success("Activity updated successfully");
        } else {
            setActivities(prev => [...prev, activityData]);
            toast.success("New activity added successfully");
        }
        setIsFormModalOpen(false);
    };

    // Summary stats
    const totalActivities = activities.length;
    const delayedActivities = activities.filter((a: Activity) => a.status === "Delay").length;
    const avgCompletion = Math.round(activities.reduce((sum: number, a: Activity) => sum + a.percent_completion, 0) / (totalActivities || 1));

    // Filtering Logic
    const filteredActivities = useMemo(() => {
        return activities.filter((activity: Activity) => {
            const matchesSearch = activity.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                activity.boq_code.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "All" || activity.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [activities, searchTerm, statusFilter]);

    return (
        <>
            <Navbar
                title="Work Progress"
                breadcrumb={["InfraPilot", "Engineer", "Progress", "Activities"]}
            />

            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Project Milestones
                        </p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">
                            Activity Master List
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Track and manage site activities, BOQ quantities, and real-time execution status.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImportExcel}
                            accept=".xlsx, .xls, .csv"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm transition-all uppercase tracking-widest"
                        >
                            Import Excel
                        </button>
                        <button
                            onClick={handleOpenCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-inter"
                        >
                            <span className="text-lg leading-none font-inter">+</span>
                            New Activity
                        </button>
                    </div>
                </div>

                {/* ── Summary Stat Cards (DSR Style) ─────────────────────────── */}
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 font-inter">
                        Activity Overview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Activities</p>
                            <p className="text-2xl font-bold text-blue-600">{totalActivities}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Synced with BOQ Master</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Delayed Tasks</p>
                            <p className="text-2xl font-bold text-rose-500">{delayedActivities}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Requiring Immediate Action</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Avg. Completion</p>
                            <p className="text-2xl font-bold text-emerald-500">{avgCompletion}%</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Across All Project Phases</p>
                        </div>
                    </div>
                </div>

                {/* ── Activity Table Container ─────────────────────────────── */}
                <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">

                    {/* ── Filter Bar (Horizontal Style) ─────────────────────────── */}
                    <div className="bg-white px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-4 font-inter">

                        {/* Left: Purple Icon + Title */}
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-base font-bold text-slate-800 whitespace-nowrap leading-none">All Tasks Filters</span>
                                <span className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{filteredActivities.length} Results</span>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="hidden md:block w-px h-8 bg-slate-100 shrink-0" />

                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search by name or code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                            />
                        </div>

                        {/* Status Dropdown */}
                        <div className="flex flex-col gap-0.5 min-w-[130px]">
                            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</label>
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer pr-8"
                                >
                                    <option value="All">All Status</option>
                                    <option value="On Track">On Track</option>
                                    <option value="Delay">Delay</option>
                                </select>
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </span>
                            </div>
                        </div>

                        {/* View Mode Dropdown (Acts as the "Filter" dropdown in DSR style) */}
                        <div className="flex flex-col gap-0.5 min-w-[140px]">
                            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">View Mode</label>
                            <div className="relative">
                                <select
                                    value={viewMode}
                                    onChange={(e) => setViewMode(e.target.value as "List" | "Gantt")}
                                    className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer pr-8"
                                >
                                    <option value="List">Activity List</option>
                                    <option value="Gantt">Gantt Timeline</option>
                                </select>
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Main Content View Switcher */}
                    {viewMode === "List" ? (
                        <div className="p-4 md:p-8 bg-slate-50/50">
                            {filteredActivities.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredActivities.map((activity) => (
                                        <div
                                            key={activity.id}
                                            className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter flex flex-col"
                                        >
                                            {/* Header: ID & Status */}
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Record #{activity.id}</span>
                                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg ${activity.status === "On Track" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                    }`}>
                                                    {activity.status}
                                                </span>
                                            </div>

                                            {/* BOQ Code & Date Range */}
                                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter mb-2">
                                                {activity.boq_code} · {activity.start_date} to {activity.end_date}
                                            </p>

                                            {/* Activity Name - primary bold value */}
                                            <p className="text-2xl font-bold text-slate-900 font-inter leading-tight mb-1">{activity.activity_name}</p>

                                            {/* Progress Bar (Compact) */}
                                            <div className="mt-3 mb-4">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completion</span>
                                                    <span className="text-xs font-black text-slate-800">{activity.percent_completion}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${activity.status === "Delay" ? "bg-rose-500" : "bg-emerald-500"}`}
                                                        style={{ width: `${activity.percent_completion}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Metrics Grid */}
                                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Completed</p>
                                                    <p className="text-xl font-bold text-slate-800 font-inter tabular-nums">{activity.total_completed.toLocaleString()}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Total units</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Today</p>
                                                    <p className="text-xl font-bold text-blue-600 font-inter tabular-nums">+{activity.today_progress.toLocaleString()}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Progress</p>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                                                <button
                                                    onClick={() => setSelectedActivity(activity)}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg hover:bg-blue-100 transition-all uppercase tracking-wider"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    View Details
                                                </button>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleOpenEdit(activity)}
                                                        className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(activity.id)}
                                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Delete"
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
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mb-6">
                                        <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 2v-6m-8-5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V9l-5-5z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">No matching activities found</p>
                                    <p className="text-xs text-slate-400 font-medium mt-1">Try adjusting your search or filters</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-8 italic-none bg-slate-50/30 min-h-[400px]">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                                    <span className="text-[10px] font-black uppercase text-slate-400">Planned Timeline</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                                    <span className="text-[10px] font-black uppercase text-slate-400">Execution Progress</span>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {filteredActivities.map((activity) => (
                                    <div key={activity.id} className="relative">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{activity.activity_name}</span>
                                            <span className="text-[10px] font-bold text-slate-400">{activity.start_date} — {activity.end_date}</span>
                                        </div>
                                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                                            {/* Full Timeline Bracket */}
                                            <div className="absolute inset-0 bg-blue-500/10 border-x border-blue-200/50" />
                                            {/* Progress Bar */}
                                            <div
                                                className={`h-full transition-all duration-1000 ${activity.status === "Delay" ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"}`}
                                                style={{ width: `${activity.percent_completion}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{activity.percent_completion}% COMPLETED</span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${activity.status === "On Track" ? "text-emerald-500" : "text-rose-500"}`}>{activity.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {activities.length === 0 && (
                                <div className="h-64 flex flex-col items-center justify-center text-slate-300">
                                    <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 2v-6m-8-5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V9l-5-5z" /></svg>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em]">No activities found to plot</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </PageTransition>

            {/* ── Activity Detail Modal ────────────────────────────────────── */}
            < Modal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setErrors({}); }}
                title={formMode === "create" ? "New Activity Record" : "Edit Activity Record"}
                maxWidth="max-w-5xl"
            >
                <div className="bg-white p-8 italic-none">
                    <form id="activity-form" onSubmit={handleSubmit} className="space-y-10">

                        {/* ── Section 1: Identity & Plan ────────────────── */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-blue-600 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide">Identity & Plan</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                {/* Activity Name */}
                                <div className="flex flex-col gap-1.5 md:col-span-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Activity Name <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        name="activity_name"
                                        value={formData.activity_name}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer ${errors.activity_name ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    >
                                        <option value="">Select Activity...</option>
                                        <option value="Excavation">Excavation</option>
                                        <option value="RCC Work">RCC Work</option>
                                        <option value="Brickwork">Brickwork</option>
                                        <option value="Plastering">Plastering</option>
                                        <option value="Flooring">Flooring</option>
                                    </select>
                                    {errors.activity_name && <p className="text-[10px] font-bold text-rose-500">{errors.activity_name}</p>}
                                </div>

                                {/* BOQ Code */}
                                <div className="flex flex-col gap-1.5 md:col-span-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        BOQ Code <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="boq_code"
                                        value={formData.boq_code}
                                        onChange={handleChange}
                                        placeholder="e.g. BOQ-STR-001"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.boq_code ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.boq_code && <p className="text-[10px] font-bold text-rose-500">{errors.boq_code}</p>}
                                </div>

                                {/* Planned Quantity */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Planned Quantity <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="planned_quantity"
                                        value={formData.planned_quantity}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.planned_quantity ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.planned_quantity && <p className="text-[10px] font-bold text-rose-500">{errors.planned_quantity}</p>}
                                </div>
                            </div>
                        </div>

                        {/* ── Section 2: Progress & Execution ─────────────── */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide">Progress & Execution</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                {/* Today’s Progress */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Today’s Progress
                                    </label>
                                    <input
                                        type="number"
                                        name="today_progress"
                                        value={formData.today_progress}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* Total Completed */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Total Completed
                                    </label>
                                    <input
                                        type="number"
                                        name="total_completed"
                                        value={formData.total_completed}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* Remaining Quantity */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Remaining Quantity
                                    </label>
                                    <input
                                        type="number"
                                        name="remaining_quantity"
                                        value={formData.remaining_quantity}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-rose-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Section 3: Timeline & Tracking ─────────────────── */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-amber-500 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide">Timeline & Tracking</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                                {/* % Completion */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        % Completion
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="percent_completion"
                                            value={formData.percent_completion}
                                            onChange={handleChange}
                                            max={100}
                                            placeholder="0"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-8"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                                    </div>
                                </div>

                                {/* Start Date */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* End Date */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        End Date <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.end_date ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.end_date && <p className="text-[10px] font-bold text-rose-500">{errors.end_date}</p>}
                                </div>

                                {/* Status */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="On Track">On Track</option>
                                        <option value="Delay">Delay</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex items-center justify-between italic-none">
                    <button
                        type="button"
                        onClick={() => { setIsFormModalOpen(false); setErrors({}); }}
                        className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="activity-form"
                        className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95"
                    >
                        {formMode === "create" ? "Add Activity Record" : "Update Activity Record"}
                    </button>
                </div>
            </Modal >

            {/* ── DETAIL MODAL (Insight View) ────────────────────────────────── */}
            < Modal
                isOpen={!!selectedActivity}
                onClose={() => setSelectedActivity(null)}
                title="Activity Insight"
                maxWidth="max-w-2xl"
            >
                {selectedActivity && (
                    <div className="bg-white p-6 italic-none text-inter">
                        {/* ── Blue Hero Card ────────────────────────────────── */}
                        <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />

                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Operation Blueprint</p>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-black tracking-tight leading-tight">{selectedActivity.activity_name}</h3>
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                        <svg className="w-6 h-6 opacity-40" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6H13a1 1 0 000 2h3.3l-1.6 1.6a1 1 0 001.4 1.4l3.3-3.3a1 1 0 000-1.4l-3.3-3.3a1 1 0 00-1.4 0zM19 19a1 1 0 01-1 1H4a1 1 0 01-1-1v-2h16v2zm1-5a1 1 0 00-1-1H4a1 1 0 00-1 1v2h16v-2zM4 11h7a1 1 0 000-2H4a1 1 0 000 2zM4 7h7a1 1 0 000-2H4a1 1 0 000 2z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Execution</p>
                                        <p className="text-xl font-black">{selectedActivity.percent_completion}% Complete</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Status</p>
                                        <p className="text-xl font-black">{selectedActivity.status.toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Diagnostic Floor ──────────────────────────────── */}
                        <div className="space-y-8 mb-10 px-1">
                            {/* Operational Data */}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Operational Data</p>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">BOQ Code</p>
                                        <p className="text-sm font-black text-slate-800 tabular-nums">{selectedActivity.boq_code}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Planned Quantity</p>
                                        <p className="text-sm font-black text-slate-800">{selectedActivity.planned_quantity}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Today’s Progress</p>
                                        <p className="text-sm font-black text-blue-600">+{selectedActivity.today_progress}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Completed</p>
                                        <p className="text-sm font-black text-emerald-600">{selectedActivity.total_completed}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Remaining Quantity</p>
                                        <p className="text-sm font-black text-rose-500">{selectedActivity.remaining_quantity}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">% Completion</p>
                                        <p className="text-sm font-black text-slate-800">{selectedActivity.percent_completion}%</p>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline Analytics */}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Timeline Analytics</p>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Start Date</p>
                                        <p className="text-sm font-black text-slate-800 tabular-nums">{selectedActivity.start_date}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">End Date</p>
                                        <p className="text-sm font-black text-slate-800 tabular-nums">{selectedActivity.end_date}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Action Footer ─────────────────────────────────── */}
                        <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                            <button
                                onClick={() => setSelectedActivity(null)}
                                className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    handleOpenEdit(selectedActivity);
                                    setSelectedActivity(null);
                                }}
                                className="flex-[1.5] px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 justify-center active:scale-95"
                            >
                                Modify Activity
                            </button>
                        </div>
                    </div>
                )}
            </Modal >
        </>
    );
};

export default ActivityListPage;
