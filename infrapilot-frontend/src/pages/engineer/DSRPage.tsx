import React, { useState, useEffect } from "react";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import Navbar from "../../components/common/Navbar";
import toast from "react-hot-toast";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DSRReport {
    id: string;
    date: string;
    project: string;
    siteLocation: string;
    status: string;
    weather: string;
    workDone: string;
    workPlanned: string;
    laborSkilled: number;
    laborUnskilled: number;
    contractor: string;
    machinery: string;
    materialReceived: string;
    materialConsumed: string;
    issues: string;
    safety: string;
    remarks: string;
    gps: string;
}

// ─── Mock History Data ─────────────────────────────────────────────────────────

const dsrHistoryData: DSRReport[] = [
    {
        id: "DSR-1024",
        date: "2026-04-10",
        project: "Skyline Tower A",
        siteLocation: "Sector 45, Gurgaon",
        status: "Verified",
        weather: "Clear",
        workDone: "Raft casting completed for Block A; Column shuttering erected up to Level 1.",
        workPlanned: "Column reinforcement for Level 1; Plinth beam casting – North Wing.",
        laborSkilled: 45,
        laborUnskilled: 75,
        contractor: "L&T Construction",
        machinery: "Excavator EX-200, Concrete Pump CP-40",
        materialReceived: "500 Bags OPC Cement, 8 MT TMT Steel",
        materialConsumed: "320 Bags OPC Cement, 4 MT TMT Steel",
        issues: "None",
        safety: "All PPE protocols followed. No incidents.",
        remarks: "Progress ahead of schedule by 2 days.",
        gps: "28.459500° N, 77.026600° E",
    },
    {
        id: "DSR-1023",
        date: "2026-04-09",
        project: "Skyline Tower A",
        siteLocation: "Sector 45, Gurgaon",
        status: "Verified",
        weather: "Cloudy",
        workDone: "Excavation for basement reached P2 level; Pile cap shuttering started.",
        workPlanned: "Finish excavation and begin blinding concrete.",
        laborSkilled: 40,
        laborUnskilled: 70,
        contractor: "L&T Construction",
        machinery: "JCB 3DX, Dumper T-12",
        materialReceived: "12 MT TMT Steel Bars",
        materialConsumed: "2 MT TMT Steel Bars",
        issues: "Slight delay in material delivery from supplier.",
        safety: "Minor trip hazard identified and cleared immediately.",
        remarks: "Material vendor notified of delay. Recovery plan in place.",
        gps: "28.459500° N, 77.026600° E",
    },
    {
        id: "DSR-1022",
        date: "2026-04-08",
        project: "Skyline Tower A",
        siteLocation: "Sector 45, Gurgaon",
        status: "Submitted",
        weather: "Rainy",
        workDone: "Dewatering of basement pit; Inspection of pile caps B1–B8.",
        workPlanned: "Resume excavation after rain clearance.",
        laborSkilled: 30,
        laborUnskilled: 50,
        contractor: "Patel Engineering",
        machinery: "Dewatering Pump DP-3, JCB 3DX",
        materialReceived: "None",
        materialConsumed: "None",
        issues: "Rain halted concrete work. 4-hour delay.",
        safety: "Workers shifted indoors during heavy rain. No injuries.",
        remarks: "Weather advisory issued for next 48 hours.",
        gps: "28.459500° N, 77.026600° E",
    },
];

// ─── Priority Badge Colors ─────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
    Verified: "bg-emerald-100 text-emerald-600",
    Submitted: "bg-blue-100 text-blue-600",
    Draft: "bg-slate-100 text-slate-500",
    Rejected: "bg-red-100 text-red-600",
};

const weatherIcons: Record<string, string> = {
    Clear: "☀️",
    Cloudy: "☁️",
    Rainy: "🌧️",
    "Extreme Heat": "🌡️",
    Windy: "💨",
};

// ─── Initial Form State ────────────────────────────────────────────────────────

const initialFormData = {
    report_date: new Date().toISOString().split("T")[0],
    projectName: "Skyline Tower A",
    site_location: "Sector 45, Gurgaon",
    weather: "Clear",
    work_done: "",
    work_planned: "",
    labour_count_skilled: "",
    labour_count_unskilled: "",
    contractor_name: "",
    machinery_used: "",
    material_received: "",
    material_consumed: "",
    issues: "",
    safety_observations: "",
    remarks: "",
    gps_location: "",
};

// ─── Profile Field Helper (matches reference image style) ─────────────────────

const ProfileField = ({
    label,
    value,
    accent,
    mono = false,
}: {
    label: string;
    value: string;
    accent?: string;
    mono?: boolean;
}) => (
    <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] block mb-1">
            {label}
        </span>
        <p className={`text-sm font-bold text-slate-800 leading-snug ${mono ? "font-mono tracking-tight" : ""} ${accent ?? ""}`}>
            {value || "—"}
        </p>
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const DSRPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<DSRReport | null>(null);
    const [gpsStatus, setGpsStatus] = useState<"idle" | "capturing" | "captured" | "error">("idle");
    const [filterStatus, setFilterStatus] = useState("All");
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [photos, setPhotos] = useState<File[]>([]);

    // ── GPS auto-capture ──────────────────────────────────────────────────────

    useEffect(() => {
        if (isFormModalOpen) captureGPS();
    }, [isFormModalOpen]);

    const captureGPS = () => {
        setGpsStatus("capturing");
        setFormData(prev => ({ ...prev, gps_location: "Acquiring…" }));
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude.toFixed(6);
                    const lng = pos.coords.longitude.toFixed(6);
                    setFormData(prev => ({ ...prev, gps_location: `${lat}° N, ${lng}° E` }));
                    setGpsStatus("captured");
                },
                () => {
                    setGpsStatus("error");
                    setFormData(prev => ({ ...prev, gps_location: "Access Denied" }));
                    toast.error("Location access denied.");
                },
                { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
            );
        } else {
            setGpsStatus("error");
            setFormData(prev => ({ ...prev, gps_location: "Not Supported" }));
        }
    };

    // ── Form handlers ─────────────────────────────────────────────────────────

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => { const u = { ...prev }; delete u[name]; return u; });
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setPhotos(prev => [...prev, ...Array.from(e.target.files!)]);
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const validateForm = () => {
        const errs: Record<string, string> = {};
        if (!formData.projectName.trim()) errs.projectName = "Required";
        if (!formData.site_location.trim()) errs.site_location = "Required";
        if (!formData.contractor_name.trim()) errs.contractor_name = "Required";
        if (!formData.work_done.trim()) errs.work_done = "Required";
        if (!formData.labour_count_skilled) errs.labour_count_skilled = "Required";
        if (!formData.labour_count_unskilled) errs.labour_count_unskilled = "Required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!validateForm()) { toast.error("Please fill all required fields."); return; }
        toast.loading("Submitting DSR…", { id: "dsr-sub" });
        setTimeout(() => {
            toast.success("DSR Submitted Successfully!", { id: "dsr-sub" });
            setIsFormModalOpen(false);
            setPhotos([]);
            setFormData(initialFormData);
            setErrors({});
        }, 1500);
    };

    // ── Filtered records ──────────────────────────────────────────────────────
    const filterTabs = ["All", "Verified", "Submitted", "Draft"];
    const filteredHistory = filterStatus === "All"
        ? dsrHistoryData
        : dsrHistoryData.filter(r => r.status === filterStatus);

    // ── Stat summary ──────────────────────────────────────────────────────────
    const totalLabor = dsrHistoryData.reduce((s, r) => s + r.laborSkilled + r.laborUnskilled, 0);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <>
            <Navbar
                title="Daily Site Report"
                breadcrumb={["InfraPilot", "Engineer", "DSR"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Field Documentation
                        </p>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                            Daily Site Report
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            End-of-day field documentation, labor, material, and safety records.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsFormModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md shadow-blue-200 transition-all"
                    >
                        <span className="text-lg leading-none">+</span>
                        New DSR Entry
                    </button>
                </div>

                {/* ── Summary Stat Cards ───────────────────────────────────── */}
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
                        DSR Overview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Reports</p>
                            <p className="text-2xl font-bold text-primary">124</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">+3 this month</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Verified DSRs</p>
                            <p className="text-2xl font-bold text-emerald-500">118</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">95.2% compliance</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Avg. Daily Labor</p>
                            <p className="text-2xl font-bold text-amber-500">{Math.round(totalLabor / dsrHistoryData.length)}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Skilled + Unskilled</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Open Issues</p>
                            <p className="text-2xl font-bold text-rose-500">2</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Pending resolution</p>
                        </div>
                    </div>
                </div>

                {/* ── Record Ledger ────────────────────────────────────────── */}
                <div>
                    {/* Filter Tabs */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">
                            Report Ledger
                        </h2>
                        <div className="flex gap-2">
                            {filterTabs.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setFilterStatus(tab)}
                                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${filterStatus === tab
                                        ? "bg-slate-800 text-white shadow-sm"
                                        : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Report Cards */}
                    <div className="grid grid-cols-1 gap-5">
                        {filteredHistory.map((report) => (
                            <div
                                key={report.id}
                                className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 cursor-pointer group transition-all"
                                onClick={() => setSelectedReport(report)}
                            >
                                {/* Left accent bar */}
                                <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-600 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />

                                {/* Top row */}
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl font-black text-slate-800">{report.id}</span>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${statusColors[report.status] ?? "bg-slate-100 text-slate-500"}`}>
                                            {report.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{weatherIcons[report.weather] ?? "🌤️"}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{report.date}</span>
                                    </div>
                                </div>

                                {/* Details grid */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 py-4 border-y border-slate-50 mb-4">
                                    <div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Contractor</span>
                                        <p className="text-xs font-bold text-slate-700">{report.contractor}</p>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Labor (S / U)</span>
                                        <p className="text-xs font-bold text-slate-700">{report.laborSkilled} / {report.laborUnskilled}</p>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Site Location</span>
                                        <p className="text-xs font-bold text-slate-700">{report.siteLocation}</p>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Issues</span>
                                        <p className={`text-xs font-bold ${report.issues === "None" ? "text-emerald-600" : "text-rose-500"}`}>{report.issues}</p>
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Action</span>
                                        <button
                                            title="View Details"
                                            onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }}
                                            className="p-2 w-fit text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Work done */}
                                <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Work Done</span>
                                    <p className="text-xs text-slate-600 font-medium line-clamp-1">{report.workDone}</p>
                                </div>
                            </div>
                        ))}

                        {filteredHistory.length === 0 && (
                            <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
                                <p className="text-slate-400 font-medium text-sm">No DSR records found for this filter.</p>
                            </div>
                        )}
                    </div>
                </div>
            </PageTransition>

            {/* ═══════════════════════════════════════════════════════════════
                NEW DSR FORM MODAL
            ═══════════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setErrors({}); }}
                title="New Daily Site Report"
                maxWidth="max-w-5xl"
            >
                <div className="bg-white p-8">
                    <form id="dsr-form" onSubmit={handleSubmit} className="space-y-10">

                        {/* ── Section 1: Site Identity ──────────────────────── */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-blue-600 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide">Site Identity</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                {/* Date */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Date <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="report_date"
                                        value={formData.report_date}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* Project Name */}
                                <div className="flex flex-col gap-1.5 md:col-span-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Project Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="projectName"
                                        value={formData.projectName}
                                        onChange={handleChange}
                                        placeholder="e.g. Skyline Tower A"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.projectName ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.projectName && <p className="text-[10px] font-bold text-rose-500">{errors.projectName}</p>}
                                </div>

                                {/* Site Location */}
                                <div className="flex flex-col gap-1.5 md:col-span-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Site Location <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="site_location"
                                        value={formData.site_location}
                                        onChange={handleChange}
                                        placeholder="e.g. Sector 45, Gurgaon"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.site_location ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.site_location && <p className="text-[10px] font-bold text-rose-500">{errors.site_location}</p>}
                                </div>

                                {/* Weather Condition */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Weather Condition
                                    </label>
                                    <select
                                        name="weather"
                                        value={formData.weather}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="Clear">☀️ Clear</option>
                                        <option value="Cloudy">☁️ Cloudy</option>
                                        <option value="Rainy">🌧️ Rainy</option>
                                        <option value="Extreme Heat">🌡️ Extreme Heat</option>
                                        <option value="Windy">💨 Windy</option>
                                    </select>
                                </div>

                                {/* GPS Location */}
                                <div className="flex flex-col gap-1.5 md:col-span-3">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        GPS Location
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${gpsStatus === "captured" ? "bg-emerald-100 text-emerald-600" : gpsStatus === "error" ? "bg-red-100 text-red-500" : "bg-amber-100 text-amber-600"}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${gpsStatus === "captured" ? "bg-emerald-500" : gpsStatus === "error" ? "bg-red-500" : "bg-amber-500 animate-pulse"}`} />
                                            {gpsStatus === "captured" ? "Captured" : gpsStatus === "error" ? "Error" : "Capturing…"}
                                        </span>
                                    </label>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={formData.gps_location}
                                            readOnly
                                            placeholder="Auto-captured on form open"
                                            className="flex-1 px-4 py-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs font-mono text-slate-600 focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={captureGPS}
                                            className="px-4 py-3 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-all whitespace-nowrap"
                                        >
                                            📍 Recapture
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Section 2: Work Details ───────────────────────── */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide">Work Details</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Work Done Today */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Work Done Today <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        name="work_done"
                                        rows={4}
                                        value={formData.work_done}
                                        onChange={handleChange}
                                        placeholder="Describe all work accomplished today…"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${errors.work_done ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.work_done && <p className="text-[10px] font-bold text-rose-500">{errors.work_done}</p>}
                                </div>

                                {/* Work Planned Tomorrow */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Work Planned Tomorrow
                                    </label>
                                    <textarea
                                        name="work_planned"
                                        rows={4}
                                        value={formData.work_planned}
                                        onChange={handleChange}
                                        placeholder="List planned activities for tomorrow…"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Section 3: Labor ─────────────────────────────── */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-indigo-600 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide">Labor Count</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                {/* Skilled Labor */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Skilled Labor <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="labour_count_skilled"
                                            min={0}
                                            value={formData.labour_count_skilled}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-lg font-black text-blue-600 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.labour_count_skilled ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">Skilled</span>
                                    </div>
                                    {errors.labour_count_skilled && <p className="text-[10px] font-bold text-rose-500 text-center">{errors.labour_count_skilled}</p>}
                                </div>

                                {/* Unskilled Labor */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Unskilled Labor <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="labour_count_unskilled"
                                            min={0}
                                            value={formData.labour_count_unskilled}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-lg font-black text-slate-700 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.labour_count_unskilled ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">Unskilled</span>
                                    </div>
                                    {errors.labour_count_unskilled && <p className="text-[10px] font-bold text-rose-500 text-center">{errors.labour_count_unskilled}</p>}
                                </div>

                                {/* Total display */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Labor</label>
                                    <div className="flex flex-col items-center justify-center h-[54px] bg-slate-800 rounded-xl px-4">
                                        <span className="text-lg font-black text-white">
                                            {(parseInt(formData.labour_count_skilled) || 0) + (parseInt(formData.labour_count_unskilled) || 0)}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-400">Total on Site</span>
                                    </div>
                                </div>

                                {/* Contractor Name */}
                                <div className="flex flex-col gap-1.5 md:col-span-3">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Contractor Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="contractor_name"
                                        value={formData.contractor_name}
                                        onChange={handleChange}
                                        placeholder="e.g. L&T Construction Pvt. Ltd."
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.contractor_name ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.contractor_name && <p className="text-[10px] font-bold text-rose-500">{errors.contractor_name}</p>}
                                </div>
                            </div>
                        </div>

                        {/* ── Section 4: Resources & Machinery ─────────────── */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-amber-500 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide">Resources & Machinery</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                {/* Machinery Used */}
                                <div className="flex flex-col gap-1.5 md:col-span-3">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Machinery Used</label>
                                    <input
                                        type="text"
                                        name="machinery_used"
                                        value={formData.machinery_used}
                                        onChange={handleChange}
                                        placeholder="e.g. Excavator EX-200, Concrete Pump CP-40, Tower Crane TC-1"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* Material Received */}
                                <div className="flex flex-col gap-1.5 md:col-span-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Material Received
                                    </label>
                                    <textarea
                                        name="material_received"
                                        rows={3}
                                        value={formData.material_received}
                                        onChange={handleChange}
                                        placeholder="e.g. 500 Bags OPC Cement&#10;8 MT TMT Steel"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                                    />
                                </div>

                                {/* Material Consumed */}
                                <div className="flex flex-col gap-1.5 md:col-span-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Material Consumed
                                    </label>
                                    <textarea
                                        name="material_consumed"
                                        rows={3}
                                        value={formData.material_consumed}
                                        onChange={handleChange}
                                        placeholder="e.g. 320 Bags OPC Cement&#10;4 MT TMT Steel"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all resize-none"
                                    />
                                </div>

                                {/* Issues / Delays */}
                                <div className="flex flex-col gap-1.5 md:col-span-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Issues / Delays
                                    </label>
                                    <textarea
                                        name="issues"
                                        rows={3}
                                        value={formData.issues}
                                        onChange={handleChange}
                                        placeholder="e.g. Material delivery delay, equipment breakdown…"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Section 5: Safety & Remarks ──────────────────── */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-rose-500 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide">Safety & Engineer Remarks</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Safety Observations */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Safety Observations
                                    </label>
                                    <textarea
                                        name="safety_observations"
                                        rows={3}
                                        value={formData.safety_observations}
                                        onChange={handleChange}
                                        placeholder="e.g. All PPE worn. Toolbox talk conducted. No incidents."
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                    />
                                </div>

                                {/* Engineer Remarks */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Engineer Remarks
                                    </label>
                                    <textarea
                                        name="remarks"
                                        rows={3}
                                        value={formData.remarks}
                                        onChange={handleChange}
                                        placeholder="Engineer's overall observations and notes…"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Section 6: Photo Upload ───────────────────────── */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-violet-500 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide">Photo Upload</h3>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                {photos.map((file, i) => (
                                    <div key={i} className="relative w-24 h-24 rounded-2xl bg-slate-100 border-2 border-slate-200 flex flex-col items-center justify-center overflow-hidden group">
                                        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-[8px] text-slate-400 font-bold mt-1 px-1 truncate w-full text-center">{file.name}</p>
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(i)}
                                            className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] hidden group-hover:flex items-center justify-center font-bold"
                                        >×</button>
                                    </div>
                                ))}
                                <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center cursor-pointer transition-all group">
                                    <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                                    <span className="text-2xl font-black text-slate-300 group-hover:text-blue-500 transition-all">+</span>
                                    <span className="text-[9px] font-bold text-slate-400 group-hover:text-blue-500 mt-1 transition-all">Add Photo</span>
                                </label>
                                {photos.length > 0 && (
                                    <div className="flex flex-col justify-center ml-2">
                                        <span className="text-xs font-bold text-slate-600">{photos.length} photo{photos.length > 1 ? "s" : ""} selected</span>
                                        <button type="button" onClick={() => setPhotos([])} className="text-[10px] font-bold text-rose-500 hover:underline text-left mt-1">Clear all</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => { setIsFormModalOpen(false); setErrors({}); setPhotos([]); }}
                        className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="dsr-form"
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition-all"
                    >
                        Submit DSR
                    </button>
                </div>
            </Modal>

            <Modal
                isOpen={!!selectedReport}
                onClose={() => setSelectedReport(null)}
                title="DSR – Report Details"
                maxWidth="max-w-3xl"
            >
                {selectedReport && (
                    <div className="bg-white">

                        {/* ── Blue Banner (matches image header) ────────────── */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-700 mx-6 mt-6 rounded-2xl p-6 flex items-center gap-5">
                            {/* Icon box */}
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shrink-0">
                                �
                            </div>
                            {/* Title + badge */}
                            <div>
                                <div className="flex items-center gap-3 mb-1.5">
                                    <h2 className="text-2xl font-black text-white tracking-tight leading-none">
                                        {selectedReport.id}
                                    </h2>
                                    <span className="px-3 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-full border border-white/30 uppercase tracking-wider">
                                        {selectedReport.status}
                                    </span>
                                </div>
                                <p className="text-blue-100 text-sm font-semibold mb-0.5">
                                    {selectedReport.project}
                                </p>
                                <p className="text-blue-200 text-[10px] font-bold uppercase tracking-[0.2em]">
                                    Joined {selectedReport.date}
                                </p>
                            </div>
                        </div>

                        {/* ── Body ─────────────────────────────────────────── */}
                        <div className="px-8 py-6 space-y-7">

                            {/* Section: Work Information */}
                            <div>
                                <div className="flex items-center gap-2.5 mb-4">
                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.18em]">
                                        Work Information
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-5">
                                    <ProfileField label="Work Done Today" value={selectedReport.workDone} />
                                    <ProfileField label="Work Planned Tomorrow" value={selectedReport.workPlanned} />
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Section: Site & Location */}
                            <div>
                                <div className="flex items-center gap-2.5 mb-4">
                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.18em]">
                                        Site & Location
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                                    <ProfileField label="Site Location" value={selectedReport.siteLocation} />
                                    <ProfileField label="Weather Condition" value={`${weatherIcons[selectedReport.weather] ?? ""} ${selectedReport.weather}`} />
                                    <ProfileField label="GPS Location" value={selectedReport.gps} mono />
                                    <ProfileField label="Report Date" value={selectedReport.date} />
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Section: Labor & Contractor */}
                            <div>
                                <div className="flex items-center gap-2.5 mb-4">
                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.18em]">
                                        Labor & Contractor
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                                    <ProfileField label="Contractor" value={selectedReport.contractor} />
                                    <ProfileField label="Machinery Used" value={selectedReport.machinery} />
                                    <ProfileField label="Skilled Labor" value={String(selectedReport.laborSkilled)} />
                                    <ProfileField label="Unskilled Labor" value={String(selectedReport.laborUnskilled)} />
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Section: Materials & Issues */}
                            <div>
                                <div className="flex items-center gap-2.5 mb-4">
                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.18em]">
                                        Materials & Issues
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                                    <ProfileField label="Material Received" value={selectedReport.materialReceived} accent="text-emerald-600" />
                                    <ProfileField label="Material Consumed" value={selectedReport.materialConsumed} accent="text-rose-500" />
                                    <ProfileField
                                        label="Issues / Delays"
                                        value={selectedReport.issues}
                                        accent={selectedReport.issues === "None" ? "text-emerald-600" : "text-rose-500"}
                                    />
                                    <ProfileField label="Safety Observations" value={selectedReport.safety} />
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Section: Engineer Remarks */}
                            <div>
                                <div className="flex items-center gap-2.5 mb-4">
                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.18em]">
                                        Engineer Remarks
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-5">
                                    <ProfileField label="Remarks" value={selectedReport.remarks} />
                                </div>
                            </div>

                        </div>

                        {/* ── Footer (matches image dark button) ───────────── */}
                        <div className="px-8 pb-7 flex justify-end">
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="px-7 py-3 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-all tracking-wide"
                            >
                                Close Report
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};


export default DSRPage;
