import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChecklistRecord {
    id: string;
    date: string;
    checklist_status: string;
    ppe_compliance: string;
    violation_type: string;
    incident_description: string;
    injury_details: string;
    action_taken: string;
    responsible_person: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const checklistHistory: ChecklistRecord[] = [
    {
        id: "SF-CHK-201",
        date: "2026-04-13",
        checklist_status: "Completed",
        ppe_compliance: "95%",
        violation_type: "None",
        incident_description: "General Site Inspection",
        injury_details: "None",
        action_taken: "Routine Check Completed",
        responsible_person: "Suresh Mani",
    },
    {
        id: "SF-CHK-202",
        date: "2026-04-12",
        checklist_status: "Issues Found",
        ppe_compliance: "75%",
        violation_type: "Height Safety",
        incident_description: "Workers without harness on level 4",
        injury_details: "Potential fall hazard identified",
        action_taken: "Work stopped, safety briefing conducted",
        responsible_person: "Vikram Singh",
    },
];

// ─── Badge Colors ────────────────────────────────────────────────────────────

// ─── Main Component ─────────────────────────────────────────────────────────────

const SafetyChecklistPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedAudit, setSelectedAudit] = useState<ChecklistRecord | null>(null);
    const [checklistData, setChecklistData] = useState<ChecklistRecord[]>(checklistHistory);
    const [isEditMode, setIsEditMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [categoryFilter, setCategoryFilter] = useState("All Reports");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [auditToDelete, setAuditToDelete] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        id: "",
        date: new Date().toISOString().split("T")[0],
        checklist_status: "Completed",
        ppe_compliance: "100%",
        violation_type: "None",
        incident_description: "",
        injury_details: "None",
        action_taken: "",
        responsible_person: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => {
                const newErrs = { ...prev };
                delete newErrs[name];
                return newErrs;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.date) newErrors.date = "Required";
        if (!formData.checklist_status) newErrors.checklist_status = "Required";
        if (!formData.responsible_person.trim()) newErrors.responsible_person = "Required";
        if (!formData.action_taken.trim()) newErrors.action_taken = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleOpenAdd = () => {
        setIsEditMode(false);
        setFormData({
            id: "",
            date: new Date().toISOString().split("T")[0],
            checklist_status: "Completed",
            ppe_compliance: "100%",
            violation_type: "None",
            incident_description: "",
            injury_details: "None",
            action_taken: "",
            responsible_person: "",
        });
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (record: ChecklistRecord) => {
        setIsEditMode(true);
        setFormData({
            id: record.id,
            date: record.date,
            checklist_status: record.checklist_status,
            ppe_compliance: record.ppe_compliance,
            violation_type: record.violation_type,
            incident_description: record.incident_description,
            injury_details: record.injury_details,
            action_taken: record.action_taken,
            responsible_person: record.responsible_person,
        });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setAuditToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!auditToDelete) return;
        setChecklistData(prev => prev.filter(t => t.id !== auditToDelete));
        toast.success("Safety record deleted");
        setIsDeleteModalOpen(false);
        setAuditToDelete(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fill all required fields.");
            return;
        }

        if (isEditMode) {
            setChecklistData(prev => prev.map(t => t.id === formData.id ? {
                ...t,
                date: formData.date,
                checklist_status: formData.checklist_status,
                ppe_compliance: formData.ppe_compliance,
                violation_type: formData.violation_type,
                incident_description: formData.incident_description,
                injury_details: formData.injury_details,
                action_taken: formData.action_taken,
                responsible_person: formData.responsible_person,
            } : t));
            toast.success("Audit Updated!");
        } else {
            const newEntry: ChecklistRecord = {
                ...formData,
                id: `SF-CHK-${200 + checklistData.length + 1}`,
            };
            setChecklistData((prev) => [newEntry, ...prev]);
            toast.success("Safety Audit Recorded!");
        }
        setIsFormModalOpen(false);
    };

    // ── Filtered records ──────────────────────────────────────────────────────
    const filteredHistory = checklistData.filter(item => {
        const matchesStatus = statusFilter === "All Status" || item.checklist_status === statusFilter;

        // Mock category filtering since category isn't in the schema yet
        const matchesCategory = categoryFilter === "All Reports" ||
            (categoryFilter === "PPE" && item.ppe_compliance !== "100%") ||
            (categoryFilter === "Hazard" && item.violation_type !== "None") ||
            (categoryFilter === "General");

        const matchesSearch = item.responsible_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.incident_description.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesStatus && matchesCategory && matchesSearch;
    });

    return (
        <>
            <Navbar
                title="Safety Checklist"
                breadcrumb={["InfraPilot", "Engineer", "Safety", "Checklist"]}
            />

            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter italic-none">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 text-inter">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1 font-inter">
                            Field Documentation Registry
                        </p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">
                            Safety Checklist
                        </h1>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xl font-inter">
                            Occupational health & safety audit sessions, PPE compliance tracking, and site hazard monitoring.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 font-inter">
                        <button
                            onClick={handleOpenAdd}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-inter"
                        >
                            <span className="text-lg leading-none font-inter">+</span>
                            New Safety Audit
                        </button>
                    </div>
                </div>

                {/* ── Summary Stat Cards (Activity Style) ────────────────────── */}
                <div className="mb-8 font-inter">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 font-inter">
                        Audit Overview
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-inter">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Total Audits</p>
                            <p className="text-2xl font-bold text-slate-900 font-inter">{checklistData.length}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Audit Sessions</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-1 group-hover:w-full h-full bg-emerald-500 transition-all duration-500 opacity-10 group-hover:opacity-5" />
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Compliance Rate</p>
                            <p className="text-2xl font-bold text-emerald-500 font-inter">
                                {Math.round((checklistData.filter(c => c.checklist_status === "Completed").length / (checklistData.length || 1)) * 100)}%
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Overall Adherence</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Safe Sessions</p>
                            <p className="text-2xl font-bold text-blue-600 font-inter">{checklistData.filter(c => c.checklist_status === "Completed").length}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Clean Audits</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Critical Fails</p>
                            <p className="text-2xl font-bold text-rose-500 font-inter">{checklistData.filter(c => c.checklist_status === "Issues Found").length}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Needs Rectification</p>
                        </div>
                    </div>
                </div>

                {/* ── Filter Bar ───────────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4 mb-8 flex flex-wrap items-center gap-4 font-inter">

                    {/* Left: Orange Icon + Title */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-100">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <span className="text-base font-bold text-slate-800 whitespace-nowrap">All Tasks Filters</span>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-8 bg-slate-100 shrink-0" />

                    {/* Search */}
                    <div className="flex flex-col gap-0.5 min-w-[180px]">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Search</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex flex-col gap-0.5 min-w-[130px]">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</label>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full appearance-none px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer pr-8"
                            >
                                <option value="All Status">All Status</option>
                                <option value="Completed">Completed</option>
                                <option value="Issues Found">Issues Found</option>
                                <option value="Pending">Pending</option>
                            </select>
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </div>
                    </div>

                    {/* Category Dropdown */}
                    <div className="flex flex-col gap-0.5 min-w-[150px]">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Filter</label>
                        <div className="relative">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full appearance-none px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer pr-8"
                            >
                                <option value="All Reports">All Reports</option>
                                <option value="PPE">PPE Audit</option>
                                <option value="General">General Safety</option>
                                <option value="Hazard">Hazard Protocol</option>
                            </select>
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Safety Audit Grid ────────────────────────────────────────── */}
                <div className="mb-20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-inter">
                        {filteredHistory.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter flex flex-col"
                            >
                                {/* Header: ID & Status */}
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Audit #{item.id}</span>
                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg ${item.checklist_status === "Completed" ? "bg-emerald-50 text-emerald-600" :
                                        item.checklist_status === "Issues Found" ? "bg-rose-50 text-rose-600" :
                                            "bg-slate-100 text-slate-500"
                                        }`}>
                                        {item.checklist_status}
                                    </span>
                                </div>

                                {/* Date & Lead */}
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter mb-2">
                                    {item.date} · Lead: {item.responsible_person}
                                </p>

                                {/* Primary Title - emboldened */}
                                <p className="text-2xl font-bold text-slate-900 font-inter leading-tight mb-1">Site Audit Session</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed line-clamp-2 mb-4">{item.incident_description}</p>

                                {/* Metrics Breakdown */}
                                <div className="grid grid-cols-2 gap-3 mt-auto">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Compliance</p>
                                        <p className="text-2xl font-bold text-blue-600 font-inter tabular-nums">{item.ppe_compliance}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">PPE Level</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Hazards</p>
                                        <p className="text-lg font-bold text-slate-800 font-inter truncate">{item.violation_type === "None" ? "Safety OK" : item.violation_type}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Risk Status</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setSelectedAudit(item)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="View Insight"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleOpenEdit(item)}
                                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                            title="Modify Entry"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteClick(item.id)}
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        title="Delete Protocol"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {checklistData.length === 0 && (
                        <div className="bg-white rounded-xl p-20 text-center border border-slate-100 shadow-sm font-inter">
                            <svg className="w-16 h-16 text-slate-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs font-inter">No safety audits registered</p>
                        </div>
                    )}
                </div>
            </PageTransition>

            {/* ── DETAIL MODAL (Insight View) ────────────────────────────────── */}
            <Modal
                isOpen={!!selectedAudit}
                onClose={() => setSelectedAudit(null)}
                title="Safety Audit Insight"
                maxWidth="max-w-2xl"
            >
                {selectedAudit && (
                    <div className="bg-white p-8 italic-none font-inter space-y-8">
                        {/* ── Blue Hero Card ────────────────────────────────── */}
                        <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Safety Compliance Record</p>
                                    <h3 className="text-2xl font-black tracking-tight">{selectedAudit.date}</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">Audit ID: {selectedAudit.id}</p>
                                </div>
                                <div className="text-right">
                                    <div className={`px-2 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase mb-2 inline-block ${selectedAudit.checklist_status === "Completed" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                                        Status: {selectedAudit.checklist_status}
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-wider opacity-40">Verification Done</p>
                                </div>
                            </div>
                        </div>

                        {/* ── Operational Stats ──────────────────────────────── */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">PPE Compliance</p>
                                <p className="text-xl font-black text-blue-600">{selectedAudit.ppe_compliance}</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Violation Type</p>
                                <p className="text-sm font-black text-slate-800 truncate">{selectedAudit.violation_type}</p>
                            </div>
                        </div>

                        {/* ── Detailed Observation ────────────────────────────── */}
                        <div className="space-y-6">
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Audit Narration</p>
                                <p className="text-xs font-bold text-slate-600 leading-relaxed italic-none">{selectedAudit.incident_description}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-center justify-between py-3 border-b border-slate-100 px-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Injury Details</span>
                                    <span className="text-xs font-black text-rose-500 uppercase tracking-tight">{selectedAudit.injury_details}</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-slate-100 px-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Lead</span>
                                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{selectedAudit.responsible_person}</span>
                                </div>
                            </div>

                            <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100">
                                <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-2 font-inter">Action Taken & Protocol</p>
                                <p className="text-sm font-black text-emerald-700 leading-relaxed italic-none tracking-tight">{selectedAudit.action_taken}</p>
                            </div>
                        </div>

                        {/* ── Footer Actions ─────────────────────────────────── */}
                        <div className="flex items-center justify-end gap-3 pt-4 font-inter">
                            <button
                                onClick={() => setSelectedAudit(null)}
                                className="px-6 py-2.5 text-[10px] font-black text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-all"
                            >
                                Close insight
                            </button>
                            <button
                                onClick={() => {
                                    handleOpenEdit(selectedAudit);
                                    setSelectedAudit(null);
                                }}
                                className="px-8 py-2.5 bg-primary text-white text-[13px] font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                Modify Audit
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── FORM MODAL (Add / Edit) ────────────────────────────────── */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setErrors({}); }}
                title={isEditMode ? "Modify Safety Audit" : "New Safety Audit Entry"}
                maxWidth="max-w-4xl"
            >
                <div className="bg-white p-8 italic-none font-inter text-inter">
                    <form id="safety-form" onSubmit={handleSubmit} className="space-y-10 text-inter">

                        {/* Section 1: Record Identity */}
                        <div className="border border-slate-200 rounded-xl p-6">
                            <h3 className="text-[15px] font-bold text-slate-800 mb-6 font-inter underline decoration-blue-500 decoration-2 underline-offset-8">Audit Identity</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter text-inter text-slate-800">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">Audit Date <span className="text-rose-500">*</span></label>
                                    <input
                                        name="date"
                                        type="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter ${errors.date ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">Responsible Officer <span className="text-rose-500">*</span></label>
                                    <input
                                        name="responsible_person"
                                        value={formData.responsible_person}
                                        onChange={handleInputChange}
                                        placeholder="Audit Lead Name"
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter ${errors.responsible_person ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Compliance Metrics */}
                        <div className="border border-slate-200 rounded-xl p-6">
                            <h3 className="text-[15px] font-bold text-slate-800 mb-6 font-inter underline decoration-emerald-500 decoration-2 underline-offset-8">Verification Data</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-inter text-inter">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">Checklist Status <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            name="checklist_status"
                                            value={formData.checklist_status}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer pr-10 font-inter"
                                        >
                                            <option value="Completed">Completed - Safe</option>
                                            <option value="Issues Found">Issues Found</option>
                                            <option value="Pending">Pending Audit</option>
                                        </select>
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">PPE Compliance (%)</label>
                                    <input
                                        name="ppe_compliance"
                                        value={formData.ppe_compliance}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 100%"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">Violation Type</label>
                                    <input
                                        name="violation_type"
                                        value={formData.violation_type}
                                        onChange={handleInputChange}
                                        placeholder="Specific Hazard"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Diagnostic Observations */}
                        <div className="border border-slate-200 rounded-xl p-6">
                            <h3 className="text-[15px] font-bold text-slate-800 mb-6 font-inter underline decoration-orange-500 decoration-2 underline-offset-8">Field Observations</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter text-inter">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">Incident Narration</label>
                                    <textarea
                                        name="incident_description"
                                        rows={3}
                                        value={formData.incident_description}
                                        onChange={handleInputChange}
                                        placeholder="Technical description of the audit session..."
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all italic-none resize-none font-inter leading-relaxed"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">Injury Audit</label>
                                    <textarea
                                        name="injury_details"
                                        rows={3}
                                        value={formData.injury_details}
                                        onChange={handleInputChange}
                                        placeholder="Medical audit findings..."
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all italic-none resize-none font-inter leading-relaxed"
                                    />
                                </div>
                                <div className="md:col-span-2 flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">Corrective Action Taken <span className="text-rose-500">*</span></label>
                                    <input
                                        name="action_taken"
                                        value={formData.action_taken}
                                        onChange={handleInputChange}
                                        placeholder="Protocol executed to mitigate risks"
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter ${errors.action_taken ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-white px-8 py-6 border-t border-slate-100 flex items-center justify-end gap-3 font-inter">
                    <button
                        type="button"
                        onClick={() => setIsFormModalOpen(false)}
                        className="px-6 py-2.5 text-[11px] font-bold text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-all"
                    >
                        Discard
                    </button>
                    <button
                        type="submit"
                        form="safety-form"
                        className="px-8 py-2.5 bg-primary text-white text-[13px] font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95"
                    >
                        {isEditMode ? "Update Master Audit" : "Finalize Protocol Entry"}
                    </button>
                </div>
            </Modal>
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setAuditToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Safety Audit"
                message="Are you sure you want to delete this safety audit record? This action will permanently remove the compliance data and cannot be undone."
                confirmText="Delete"
                type="danger"
            />
        </>
    );
};

export default SafetyChecklistPage;
