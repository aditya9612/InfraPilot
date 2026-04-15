import React, { useState, useMemo } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DailyEntry {
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

const mockDailyEntries: DailyEntry[] = [
    {
        id: 101,
        activity_name: "Excavation",
        boq_code: "BOQ-STR-001",
        today_progress: 120,
        planned_quantity: 5000,
        total_completed: 3800,
        remaining_quantity: 1200,
        percent_completion: 76,
        start_date: "2026-03-01",
        end_date: "2026-04-20",
        status: "On Track",
    },
    {
        id: 102,
        activity_name: "RCC Work",
        boq_code: "BOQ-STR-002",
        today_progress: 45,
        planned_quantity: 1500,
        total_completed: 600,
        remaining_quantity: 900,
        percent_completion: 40,
        start_date: "2026-03-15",
        end_date: "2026-05-30",
        status: "Delay",
    },
];

const initialFormData = {
    activity_name: "",
    boq_code: "",
    planned_quantity: "",
    today_progress: "",
    total_completed: "",
    remaining_quantity: "",
    percent_completion: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    status: "On Track" as "On Track" | "Delay",
};

// ─── Main Component ─────────────────────────────────────────────────────────────

const DailyProgressEntryPage = () => {
    const [activities, setActivities] = useState<DailyEntry[]>(mockDailyEntries);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [formData, setFormData] = useState(initialFormData);
    const [editId, setEditId] = useState<number | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    // Summary stats
    const totalEntries = activities.length;
    const avgTodayProgress = totalEntries > 0 ? (activities.reduce((sum, a) => sum + a.today_progress, 0) / totalEntries).toFixed(1) : "0";

    // ── CRUD Handlers ────────────────────────────────────────────────────────
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

    const handleOpenEdit = (entry: DailyEntry) => {
        setFormMode("edit");
        setEditId(entry.id);
        setFormData({
            activity_name: entry.activity_name,
            boq_code: entry.boq_code,
            planned_quantity: entry.planned_quantity.toString(),
            today_progress: entry.today_progress.toString(),
            total_completed: entry.total_completed.toString(),
            remaining_quantity: entry.remaining_quantity.toString(),
            percent_completion: entry.percent_completion.toString(),
            start_date: entry.start_date,
            end_date: entry.end_date,
            status: entry.status,
        });
        setErrors({});
        setIsFormModalOpen(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Are you sure you want to delete this entry?")) {
            setActivities(prev => prev.filter(a => a.id !== id));
            toast.success("Entry deleted successfully");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all required fields");
            return;
        }

        const entryData: DailyEntry = {
            id: formMode === "edit" ? editId! : Date.now(),
            activity_name: formData.activity_name,
            boq_code: formData.boq_code,
            today_progress: Number(formData.today_progress),
            planned_quantity: Number(formData.planned_quantity),
            total_completed: Number(formData.total_completed),
            remaining_quantity: Number(formData.remaining_quantity),
            percent_completion: Number(formData.percent_completion),
            start_date: formData.start_date,
            end_date: formData.end_date,
            status: formData.status,
        };

        if (formMode === "edit") {
            setActivities(prev => prev.map(a => a.id === editId ? entryData : a));
            toast.success("Entry updated successfully");
        } else {
            setActivities(prev => [entryData, ...prev]);
            toast.success("Daily progress recorded");
        }
        setIsFormModalOpen(false);
    };

    const filteredEntries = useMemo(() => {
        return activities.filter((entry: DailyEntry) => {
            const matchesSearch = entry.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.boq_code.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "All" || entry.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [activities, searchTerm, statusFilter]);

    return (
        <>
            <Navbar
                title="Daily Progress Entry"
                breadcrumb={["InfraPilot", "Engineer", "Progress", "Entry"]}
            />

            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Operational Documentation
                        </p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">
                            Daily Progress Entry
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Submit and review daily executed quantities and operational site events.
                        </p>
                    </div>

                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-inter"
                    >
                        <span className="text-lg leading-none font-inter">+</span>
                        New Progress Entry
                    </button>
                </div>

                {/* ── Summary Stats (DSR Style) ───────────────────────────── */}
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 font-inter">
                        Daily Overview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Entries</p>
                            <p className="text-2xl font-bold text-blue-600">{totalEntries}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Total records captured</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Avg. Daily Progress</p>
                            <p className="text-2xl font-bold text-emerald-600">{avgTodayProgress} <span className="text-sm uppercase tracking-tighter font-black opacity-50 ml-1">Cu.m</span></p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Mean execution rate</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all text-center">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Weather</p>
                            <p className="text-2xl font-bold text-amber-500">Sunny ☀️</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Optimal conditions</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Site</p>
                            <p className="text-2xl font-bold text-slate-800">C-64</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Current active zone</p>
                        </div>
                    </div>
                </div>

                {/* ── Entry Ledger (Tabular View) ─────────────────────────── */}
                <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">

                    {/* ── Filter Bar (Horizontal Style) ─────────────────────────── */}
                    <div className="bg-white px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-4 font-inter">

                        {/* Left: Blue Icon + Title */}
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-base font-bold text-slate-800 whitespace-nowrap leading-none">Progress Filters</span>
                                <span className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{filteredEntries.length} Results</span>
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
                                placeholder="Search by activity or code..."
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
                    </div>

                    <div className="p-4 md:p-8 bg-slate-50/50">
                        {filteredEntries.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredEntries.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter flex flex-col"
                                    >
                                        {/* Header: ID & Status */}
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Record #{entry.id}</span>
                                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg ${entry.status === "On Track" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                }`}>
                                                {entry.status}
                                            </span>
                                        </div>

                                        {/* BOQ Code & Date Range */}
                                        <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter mb-2">
                                            {entry.boq_code} · {entry.start_date} to {entry.end_date}
                                        </p>

                                        {/* Activity Name - primary bold value */}
                                        <p className="text-2xl font-bold text-slate-900 font-inter leading-tight mb-2">{entry.activity_name}</p>

                                        {/* Core Metric (Today's Progress) - Highlighted */}
                                        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50 mb-4">
                                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Today's Executed Quantity</p>
                                            <div className="flex items-baseline gap-1.5">
                                                <p className="text-3xl font-black text-blue-600">+{entry.today_progress.toLocaleString()}</p>
                                                <p className="text-[10px] font-black text-blue-400 uppercase">Cu.m</p>
                                            </div>
                                        </div>

                                        {/* Metrics Grid */}
                                        <div className="grid grid-cols-2 gap-3 mb-5">
                                            <div>
                                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Completed</p>
                                                <p className="text-xl font-bold text-slate-800 font-inter tabular-nums">{entry.total_completed.toLocaleString()}</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Accumulated</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Remaining</p>
                                                <p className="text-xl font-bold text-rose-500 font-inter tabular-nums">{entry.remaining_quantity.toLocaleString()}</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Pending units</p>
                                            </div>
                                        </div>

                                        {/* Progress Bar (Compact) */}
                                        <div className="mt-auto pt-4 border-t border-slate-50">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Completion</span>
                                                <span className="text-xs font-black text-slate-800">{entry.percent_completion}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-600 transition-all duration-1000"
                                                    style={{ width: `${entry.percent_completion}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-between pt-4 mt-4">
                                            <button
                                                onClick={() => setSelectedEntry(entry)}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg hover:bg-blue-100 transition-all uppercase tracking-wider"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                View Insight
                                            </button>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleOpenEdit(entry)}
                                                    className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(entry.id)}
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
                                <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">No progress entries found</p>
                                <p className="text-xs text-slate-400 font-medium mt-1">Try adjusting your search or filters</p>
                            </div>
                        )}
                    </div>
                </div>
            </PageTransition>

            {/* Log Progress Modal (DSR Style) */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setErrors({}); }}
                title={formMode === "create" ? "Record Daily Progress" : "Edit Progress Record"}
                maxWidth="max-w-5xl"
            >
                <div className="bg-white p-8 italic-none">
                    <form id="progress-form" onSubmit={handleSubmit} className="space-y-10">

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
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer appearance-none ${errors.activity_name ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
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
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors.boq_code ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
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
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors.planned_quantity ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
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
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-rose-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-8"
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
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none transition-all"
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
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 focus:outline-none transition-all ${errors.end_date ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
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
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer appearance-none"
                                    >
                                        <option value="On Track">On Track</option>
                                        <option value="Delay">Delay</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex items-center justify-between">
                    <button type="button" onClick={() => { setIsFormModalOpen(false); setErrors({}); }} className="text-xs font-bold text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-all">Discard</button>
                    <button type="submit" form="progress-form" className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95">
                        {formMode === "create" ? "Save Progress Record" : "Update Records"}
                    </button>
                </div>
            </Modal>

            {/* View Detail Modal */}
            <Modal
                isOpen={!!selectedEntry}
                onClose={() => setSelectedEntry(null)}
                title="Execution Insight"
                maxWidth="max-w-xl"
            >
                {selectedEntry && (
                    <div className="space-y-6 italic-none font-inter">
                        <div className="p-6 bg-gradient-to-br from-indigo-900 to-primary rounded-2xl text-white shadow-xl shadow-primary/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Activity Context</p>
                                <h3 className="text-2xl font-black tracking-tight mb-4">{selectedEntry.activity_name}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                                        <p className="text-[9px] font-bold uppercase opacity-60">Completion</p>
                                        <p className="text-lg font-black">{selectedEntry.percent_completion}%</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                                        <p className="text-[9px] font-bold uppercase opacity-60">Status</p>
                                        <p className="text-lg font-black">{selectedEntry.status}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">BOQ Code</label>
                                    <p className="text-sm font-bold text-slate-700 tracking-tight">{selectedEntry.boq_code}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Today's Progress</label>
                                    <p className="text-sm font-bold text-blue-600">+{selectedEntry.today_progress}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Done</label>
                                    <p className="text-sm font-bold text-slate-700">{selectedEntry.total_completed} / {selectedEntry.planned_quantity}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Remaining Quantity</label>
                                    <p className="text-sm font-bold text-rose-500">{selectedEntry.remaining_quantity}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Start Date</label>
                                    <p className="text-sm font-bold text-slate-700">{selectedEntry.start_date}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">End Date</label>
                                    <p className="text-sm font-bold text-slate-700">{selectedEntry.end_date}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">% Completion</label>
                                    <p className="text-sm font-bold text-slate-800">{selectedEntry.percent_completion}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedEntry(null)}
                                className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all uppercase tracking-widest"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    handleOpenEdit(selectedEntry);
                                    setSelectedEntry(null);
                                }}
                                className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95 font-inter"
                            >
                                Edit Record
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default DailyProgressEntryPage;
