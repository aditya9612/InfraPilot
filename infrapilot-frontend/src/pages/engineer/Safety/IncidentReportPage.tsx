import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface IncidentRecord {
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

const incidentHistory: IncidentRecord[] = [
    {
        id: "SF-INC-401",
        date: "2026-04-12",
        checklist_status: "Issues Found",
        ppe_compliance: "60%",
        violation_type: "Height Safety",
        incident_description: "Worker slipped on scaffolding while plastering. Safety harness was not hooked.",
        injury_details: "Minor bruise on elbow. No serious injury.",
        action_taken: "Immediate site stand-down. Retraining of worker and supervisor.",
        responsible_person: "Vikram Singh",
    },
];

// ─── Profile Field Helper ──────────────────────────────────────────────────────

// ─── Main Component ─────────────────────────────────────────────────────────────

const IncidentReportPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
    const [incidentData, setIncidentData] = useState<IncidentRecord[]>(incidentHistory);
    const [isEditMode, setIsEditMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [categoryFilter, setCategoryFilter] = useState("All Reports");

    const [formData, setFormData] = useState({
        id: "",
        date: new Date().toISOString().split("T")[0],
        checklist_status: "Issues Found",
        ppe_compliance: "100%",
        violation_type: "Height Safety",
        incident_description: "",
        injury_details: "",
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
        if (!formData.incident_description) newErrors.incident_description = "Required";
        if (!formData.action_taken) newErrors.action_taken = "Required";
        if (!formData.responsible_person) newErrors.responsible_person = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleOpenAdd = () => {
        setIsEditMode(false);
        setFormData({
            id: "",
            date: new Date().toISOString().split("T")[0],
            checklist_status: "Issues Found",
            ppe_compliance: "100%",
            violation_type: "Height Safety",
            incident_description: "",
            injury_details: "",
            action_taken: "",
            responsible_person: "",
        });
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (record: IncidentRecord) => {
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

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this incident report?")) {
            setIncidentData(prev => prev.filter(t => t.id !== id));
            toast.success("Record deleted");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fill all required fields.");
            return;
        }

        if (isEditMode) {
            setIncidentData(prev => prev.map(t => t.id === formData.id ? {
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
            toast.success("Incident Updated!");
        } else {
            const newEntry: IncidentRecord = {
                ...formData,
                id: `SF-INC-${400 + incidentData.length + 1}`,
            };
            setIncidentData((prev) => [newEntry, ...prev]);
            toast.success("Incident Report Lodged!");
        }
        setIsFormModalOpen(false);
    };

    // ── Filtered records ──────────────────────────────────────────────────────
    const filteredHistory = incidentData.filter(item => {
        // Since status isn't explicitly in the schema yet, we map categories or descriptions
        const matchesStatus = statusFilter === "All Status" ||
            (statusFilter === "Critical" && item.violation_type === "Height Safety") ||
            (statusFilter === "Moderate" && item.violation_type !== "Height Safety") ||
            (statusFilter === "Near Miss" && item.injury_details.toLowerCase().includes("none"));

        const matchesCategory = categoryFilter === "All Reports" ||
            (categoryFilter === "Height" && item.violation_type === "Height Safety") ||
            (categoryFilter === "PPE" && item.violation_type === "PPE Violation") ||
            (categoryFilter === "Electrical" && item.violation_type === "Electrical Hazard");

        const matchesSearch = item.responsible_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.incident_description.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesStatus && matchesCategory && matchesSearch;
    });

    return (
        <>
            <Navbar
                title="Incident Report"
                breadcrumb={["InfraPilot", "Engineer", "Safety", "Incident"]}
            />

            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter italic-none">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 text-inter">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1 font-inter">
                            Field Documentation Registry
                        </p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">
                            Incident Registry
                        </h1>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xl font-inter">
                            Official logging for site safety violations, near-misses, and injury occurrences with corrective action tracking.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 font-inter">
                        <button
                            onClick={handleOpenAdd}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-inter"
                        >
                            <span className="text-lg leading-none font-inter">+</span>
                            Lodge New Incident
                        </button>
                    </div>
                </div>

                {/* ── Summary Stat Cards (Activity Style) ────────────────────── */}
                <div className="mb-8 font-inter">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 font-inter">
                        Safety Metrics
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-inter">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Total Logged</p>
                            <p className="text-2xl font-bold text-slate-900 font-inter">{incidentData.length}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Incident Entries</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-1 group-hover:w-full h-full bg-rose-500 transition-all duration-500 opacity-10 group-hover:opacity-5" />
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Height Safety</p>
                            <p className="text-2xl font-bold text-rose-500 font-inter">
                                {incidentData.filter(i => i.violation_type === "Height Safety").length}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Critical Violations</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Resolved Cases</p>
                            <p className="text-2xl font-bold text-emerald-500 font-inter">
                                {incidentData.filter(i => i.action_taken !== "").length}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Corrective Actions</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">PPE Issues</p>
                            <p className="text-2xl font-bold text-blue-600 font-inter">
                                {incidentData.filter(i => i.violation_type === "PPE Violation").length}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Compliance Alerts</p>
                        </div>
                    </div>
                </div>

                {/* ── Filter Bar ───────────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4 mb-8 flex flex-wrap items-center gap-4 font-inter">

                    {/* Icon + Title */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-md shadow-rose-100">
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
                                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Severity Dropdown */}
                    <div className="flex flex-col gap-0.5 min-w-[130px]">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</label>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full appearance-none px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer pr-8"
                            >
                                <option value="All Status">All Status</option>
                                <option value="Critical">Critical Breach</option>
                                <option value="Moderate">Moderate Risk</option>
                                <option value="Near Miss">Near Miss</option>
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
                                className="w-full appearance-none px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer pr-8"
                            >
                                <option value="All Reports">All Reports</option>
                                <option value="Height">Height Safety</option>
                                <option value="PPE">PPE Violation</option>
                                <option value="Electrical">Electrical Hazard</option>
                            </select>
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Incident Registry Grid ─────────────────────────────────── */}
                <div className="mb-20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-inter">
                        {filteredHistory.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter flex flex-col"
                            >
                                {/* Header: ID & Severity */}
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Incident #{item.id}</span>
                                    <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg bg-rose-50 text-rose-600">
                                        Critical Breach
                                    </span>
                                </div>

                                {/* Date & Auditor */}
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter mb-2">
                                    {item.date} · Lead: {item.responsible_person}
                                </p>

                                {/* Violation Title - primay value */}
                                <p className="text-2xl font-bold text-slate-900 font-inter leading-tight mb-1">{item.violation_type}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed line-clamp-2 mb-4">{item.incident_description}</p>

                                {/* Diagnostic Metrics Breakdown */}
                                <div className="grid grid-cols-2 gap-3 mt-auto">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Protection</p>
                                        <p className="text-2xl font-bold text-rose-600 font-inter tabular-nums">{item.ppe_compliance}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">PPE Level</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Injury Audit</p>
                                        <p className="text-lg font-bold text-slate-800 font-inter truncate">{item.injury_details === "None" ? "Clean Registry" : item.injury_details}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Medical Status</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setSelectedIncident(item)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                            title="View Analysis"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleOpenEdit(item)}
                                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                            title="Modify Case"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        title="Delete Registry"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {incidentData.length === 0 && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-20 text-center mt-8 font-inter">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <p className="text-emerald-900 font-black text-xl mb-2 font-inter uppercase tracking-tight">Zero Incidents Logged</p>
                            <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em]">Safe Site Protocol Maintained</p>
                        </div>
                    )}
                </div>
            </PageTransition>

            {/* ── DETAIL MODAL (Insight View) ────────────────────────────────── */}
            <Modal
                isOpen={!!selectedIncident}
                onClose={() => setSelectedIncident(null)}
                title="Critical Evidence Analysis"
                maxWidth="max-w-2xl"
            >
                {selectedIncident && (
                    <div className="bg-white p-8 italic-none font-inter space-y-8">
                        {/* ── Blue Hero Card ────────────────────────────────── */}
                        <div className="bg-rose-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Critical Evidence Report</p>
                                    <h3 className="text-2xl font-black tracking-tight">{selectedIncident.date}</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">Case ID: {selectedIncident.id}</p>
                                </div>
                                <div className="text-right">
                                    <div className="px-2 py-1 bg-white/20 rounded-lg text-[9px] font-black tracking-widest uppercase mb-2 inline-block">
                                        Type: {selectedIncident.violation_type}
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-wider opacity-40">Logged Entry</p>
                                </div>
                            </div>
                        </div>

                        {/* ── Operational Analysis ────────────────────────────── */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">PPE Level</p>
                                <p className="text-xl font-black text-rose-600">{selectedIncident.ppe_compliance}</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Injury Audit</p>
                                <p className="text-sm font-black text-slate-800 truncate">{selectedIncident.injury_details}</p>
                            </div>
                        </div>

                        {/* ── Detailed Evidence ────────────────────────────── */}
                        <div className="space-y-6">
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Technical Narration</p>
                                <p className="text-xs font-bold text-slate-600 leading-relaxed italic-none">{selectedIncident.incident_description}</p>
                            </div>

                            <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100">
                                <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-2 font-inter">Corrective Strategy Executed</p>
                                <p className="text-sm font-black text-emerald-700 leading-relaxed italic-none tracking-tight">{selectedIncident.action_taken}</p>
                            </div>

                            <div className="flex items-center justify-between py-4 border-t border-slate-100 px-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Officer</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-600 uppercase">
                                        {selectedIncident.responsible_person.substring(0, 2)}
                                    </div>
                                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{selectedIncident.responsible_person}</span>
                                </div>
                            </div>
                        </div>

                        {/* ── Footer Actions ─────────────────────────────────── */}
                        <div className="flex items-center justify-end gap-3 pt-4 font-inter">
                            <button
                                onClick={() => setSelectedIncident(null)}
                                className="px-6 py-2.5 text-[10px] font-black text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-all"
                            >
                                Dismiss analysis
                            </button>
                            <button
                                onClick={() => {
                                    handleOpenEdit(selectedIncident);
                                    setSelectedIncident(null);
                                }}
                                className="px-8 py-2.5 bg-rose-600 text-white text-[13px] font-bold rounded-xl shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all flex items-center gap-2 active:scale-95"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                Modify Case Registry
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── FORM MODAL (Add / Edit) ────────────────────────────────── */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setErrors({}); }}
                title={isEditMode ? "Modify Case Registry" : "Lodge Critical Incident"}
                maxWidth="max-w-4xl"
            >
                <div className="bg-white p-8 italic-none font-inter text-inter">
                    <form id="incident-form" onSubmit={handleSubmit} className="p-0 space-y-10 text-inter">

                        {/* Section 1: Record Identity */}
                        <div className="border border-slate-200 rounded-xl p-6">
                            <h3 className="text-[15px] font-bold text-slate-800 mb-6 font-inter underline decoration-rose-600 decoration-2 underline-offset-8">Registry Metadata</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-inter text-inter text-slate-800">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">Observation Date <span className="text-rose-500">*</span></label>
                                    <input
                                        name="date"
                                        type="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all font-inter ${errors.date ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">Breach Category</label>
                                    <div className="relative">
                                        <select
                                            name="violation_type"
                                            value={formData.violation_type}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 appearance-none cursor-pointer pr-10 font-inter"
                                        >
                                            <option value="Height Safety">Height Safety Breach</option>
                                            <option value="PPE Violation">PPE Non-Compliance</option>
                                            <option value="Material Handling">Unsafe Material Handling</option>
                                            <option value="Electrical Hazard">Electrical Hazard</option>
                                            <option value="Machinery Misuse">Machinery Misuse</option>
                                        </select>
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">Audit Lead <span className="text-rose-500">*</span></label>
                                    <input
                                        name="responsible_person"
                                        value={formData.responsible_person}
                                        onChange={handleInputChange}
                                        placeholder="Officer Name"
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none transition-all font-inter ${errors.responsible_person ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Technical Scope */}
                        <div className="border border-slate-200 rounded-xl p-6">
                            <h3 className="text-[15px] font-bold text-slate-800 mb-6 font-inter underline decoration-amber-500 decoration-2 underline-offset-8">Field Diagnostics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter text-inter">
                                <div className="md:col-span-2 flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">Incident Narration <span className="text-rose-500">*</span></label>
                                    <textarea
                                        name="incident_description"
                                        rows={3}
                                        value={formData.incident_description}
                                        onChange={handleInputChange}
                                        placeholder="Technical description of the breach occurrence..."
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all italic-none resize-none font-inter leading-relaxed ${errors.incident_description ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">PPE Compliance (%)</label>
                                    <input
                                        name="ppe_compliance"
                                        value={formData.ppe_compliance}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 100%"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all font-inter"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">Injury Audit</label>
                                    <input
                                        name="injury_details"
                                        value={formData.injury_details}
                                        onChange={handleInputChange}
                                        placeholder="Specifics or 'None Recorded'"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all font-inter"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Mitigation Protocol */}
                        <div className="border border-slate-200 rounded-xl p-6">
                            <h3 className="text-[15px] font-bold text-slate-800 mb-6 font-inter underline decoration-emerald-500 decoration-2 underline-offset-8">Corrective Strategy</h3>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-bold text-slate-700 font-inter">Mitigation Executed <span className="text-rose-500">*</span></label>
                                <textarea
                                    name="action_taken"
                                    rows={3}
                                    value={formData.action_taken}
                                    onChange={handleInputChange}
                                    placeholder="Protocol executed to normalize conditions..."
                                    className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all italic-none resize-none font-inter leading-relaxed ${errors.action_taken ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                />
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
                        form="incident-form"
                        className="px-8 py-2.5 bg-rose-600 text-white text-[13px] font-bold rounded-lg shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all flex items-center gap-2 active:scale-95 font-inter"
                    >
                        {isEditMode ? "Update Master Registry" : "Finalize Incident Lodge"}
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default IncidentReportPage;

