import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ReportMetric {
    label: string;
    value: string;
    accent?: string;
}

interface ReportType {
    id: string;
    name: string;
    description: string;
    icon: string;
    badgeColor: string;       // badge background + text
    accentBar: string;        // left accent bar colour
    lastGenerated: string;
    size: string;
    frequency: string;
    metrics: ReportMetric[];
}

// ─── Report Definitions ─────────────────────────────────────────────────────────

const reportTypes: ReportType[] = [
    {
        id: "daily",
        name: "Daily Report",
        description: "Full summary of today's site operations — labor deployed, work completed, materials consumed, and any issues logged.",
        icon: "📋",
        badgeColor: "bg-blue-50 text-blue-600",
        accentBar: "bg-blue-600",
        lastGenerated: "Today, 08:30 AM",
        size: "1.2 MB",
        frequency: "Daily",
        metrics: [
            { label: "Total Labor", value: "142 Workers", accent: "text-blue-600" },
            { label: "Concrete Poured", value: "120 m³" },
            { label: "Steel Fixed", value: "8.5 Tons" },
            { label: "Safety Incidents", value: "0", accent: "text-emerald-600" },
        ],
    },
    {
        id: "weekly",
        name: "Weekly Progress",
        description: "7-day performance summary covering milestone achievements, planned vs actual progress, and workforce trends.",
        icon: "📈",
        badgeColor: "bg-emerald-50 text-emerald-600",
        accentBar: "bg-emerald-500",
        lastGenerated: "Mon, 10:00 AM",
        size: "4.5 MB",
        frequency: "Weekly",
        metrics: [
            { label: "Planned Progress", value: "85%" },
            { label: "Actual Progress", value: "82%", accent: "text-amber-600" },
            { label: "Labor Hours", value: "4,800 hrs" },
            { label: "Cost This Week", value: "₹45.2 L", accent: "text-rose-500" },
        ],
    },
    {
        id: "labor",
        name: "Labor Report",
        description: "Workforce breakdown by skill category, attendance, overtime, and contractor-wise deployment summary.",
        icon: "👷",
        badgeColor: "bg-amber-50 text-amber-600",
        accentBar: "bg-amber-500",
        lastGenerated: "Today, 07:15 AM",
        size: "0.8 MB",
        frequency: "Daily",
        metrics: [
            { label: "Skilled Labor", value: "45", accent: "text-blue-600" },
            { label: "Unskilled Labor", value: "88" },
            { label: "Supervisors", value: "9" },
            { label: "Overtime Hours", value: "24 hrs", accent: "text-amber-600" },
        ],
    },
    {
        id: "material",
        name: "Material Consumption",
        description: "Inflow vs outflow reconciliation for all materials — cement, steel, aggregates — with stock closing balances.",
        icon: "🏗️",
        badgeColor: "bg-indigo-50 text-indigo-600",
        accentBar: "bg-indigo-500",
        lastGenerated: "Yesterday, 05:45 PM",
        size: "2.1 MB",
        frequency: "Daily",
        metrics: [
            { label: "Cement Consumed", value: "450 Bags", accent: "text-rose-500" },
            { label: "Steel Used", value: "12 Tons", accent: "text-rose-500" },
            { label: "Aggregate Used", value: "320 m³" },
            { label: "Closing Stock Value", value: "₹1.2 Cr", accent: "text-emerald-600" },
        ],
    },
    {
        id: "issue",
        name: "Issue Report",
        description: "Logged site issues, safety observations, delays, and their current resolution status and priority levels.",
        icon: "⚠️",
        badgeColor: "bg-rose-50 text-rose-600",
        accentBar: "bg-rose-500",
        lastGenerated: "Today, 11:30 AM",
        size: "0.5 MB",
        frequency: "As needed",
        metrics: [
            { label: "Open Issues", value: "3", accent: "text-rose-500" },
            { label: "Resolved Today", value: "2", accent: "text-emerald-600" },
            { label: "Weather Delay", value: "4 hrs", accent: "text-amber-600" },
            { label: "Manpower Gap", value: "6%", accent: "text-amber-600" },
        ],
    },
];

// ─── Stat Summary ───────────────────────────────────────────────────────────────

const statCards = [
    { label: "Total Reports", value: "42", sub: "+3 this week", accent: "text-primary" },
    { label: "Generated Today", value: "5", sub: "All 5 types", accent: "text-emerald-500" },
    { label: "Avg. Report Size", value: "1.8 MB", sub: "Across all types", accent: "text-amber-500" },
    { label: "Open Issues", value: "3", sub: "2 High Priority", accent: "text-rose-500" },
];

// ─── ProfileField Helper ────────────────────────────────────────────────────────

const ProfileField = ({
    label,
    value,
    accent,
}: {
    label: string;
    value: string;
    accent?: string;
}) => (
    <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] block mb-1">
            {label}
        </span>
        <p className={`text-sm font-bold text-slate-800 leading-snug ${accent ?? ""}`}>
            {value || "—"}
        </p>
    </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────────

const ReportsPage = () => {
    const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState("All");

    const handleExport = (report: ReportType) => {
        setLoadingId(report.id);
        toast.loading(`Generating ${report.name}…`, { id: `exp-${report.id}` });
        setTimeout(() => {
            toast.success(`${report.name} exported successfully!`, { id: `exp-${report.id}` });
            setLoadingId(null);
        }, 1800);
    };

    const frequencyFilters = ["All", "Daily", "Weekly", "As needed"];
    const filtered = activeFilter === "All"
        ? reportTypes
        : reportTypes.filter(r => r.frequency === activeFilter);

    return (
        <>
            <Navbar
                title="Reports"
                breadcrumb={["InfraPilot", "Engineer", "Reports"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Site Engineer
                        </p>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                            Reports
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Generate, view, and export daily, weekly, labor, material, and issue reports.
                        </p>
                    </div>

                    <button
                        onClick={() => toast.success("Refreshing all reports…")}
                        className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold shadow-sm hover:border-slate-300 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh Reports
                    </button>
                </div>

                {/* ── Stat Cards ───────────────────────────────────────────── */}
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
                        Report Overview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {statCards.map((s) => (
                            <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
                                <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{s.sub}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Filter Tabs + Report Cards ───────────────────────────── */}
                <div>
                    {/* Section header + filter */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">
                            Available Reports
                        </h2>
                        <div className="flex gap-2">
                            {frequencyFilters.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveFilter(tab)}
                                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeFilter === tab
                                            ? "bg-slate-800 text-white shadow-sm"
                                            : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((report) => (
                            <div
                                key={report.id}
                                className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all flex flex-col gap-5 group"
                            >
                                {/* Accent bar */}
                                <div className={`absolute left-0 top-5 bottom-5 w-1 ${report.accentBar} rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity`} />

                                {/* Card header */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${report.badgeColor}`}>
                                            {report.icon}
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                                {report.frequency}
                                            </p>
                                            <h3 className="text-base font-black text-slate-800 leading-tight">
                                                {report.name}
                                            </h3>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 shrink-0">{report.size}</span>
                                </div>

                                {/* Description */}
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    {report.description}
                                </p>

                                {/* Metrics preview */}
                                <div className="grid grid-cols-2 gap-3 py-4 border-y border-slate-50">
                                    {report.metrics.map((m, i) => (
                                        <div key={i}>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{m.label}</p>
                                            <p className={`text-sm font-black text-slate-800 ${m.accent ?? ""}`}>{m.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer: last generated + buttons */}
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                                        <span className="text-[10px] font-bold text-slate-400">{report.lastGenerated}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {/* View button */}
                                        <button
                                            title="View Report"
                                            onClick={() => setSelectedReport(report)}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                        {/* Export button */}
                                        <button
                                            onClick={() => handleExport(report)}
                                            disabled={loadingId === report.id}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-blue-200"
                                        >
                                            {loadingId === report.id ? (
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            )}
                                            Export
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filtered.length === 0 && (
                            <div className="col-span-3 bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                                <p className="text-slate-400 text-sm font-medium">No reports match this filter.</p>
                            </div>
                        )}
                    </div>
                </div>
            </PageTransition>

            {/* ═══════════════════════════════════════════════════════════════
                REPORT DETAIL MODAL  (matches DSR / User Profile style)
            ═══════════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={!!selectedReport}
                onClose={() => setSelectedReport(null)}
                title="Report Details"
                maxWidth="max-w-2xl"
            >
                {selectedReport && (
                    <div className="bg-white">

                        {/* Blue Banner */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-700 mx-6 mt-6 rounded-2xl p-6 flex items-center gap-5">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                                {selectedReport.icon}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1.5">
                                    <h2 className="text-xl font-black text-white tracking-tight leading-none">
                                        {selectedReport.name}
                                    </h2>
                                    <span className="px-3 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-full border border-white/30 uppercase tracking-wider">
                                        {selectedReport.frequency}
                                    </span>
                                </div>
                                <p className="text-blue-100 text-sm font-semibold mb-0.5">
                                    Last generated: {selectedReport.lastGenerated}
                                </p>
                                <p className="text-blue-200 text-[10px] font-bold uppercase tracking-[0.2em]">
                                    File size: {selectedReport.size}
                                </p>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="px-8 py-6 space-y-7">

                            {/* Section: Description */}
                            <div>
                                <div className="flex items-center gap-2.5 mb-4">
                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.18em]">
                                        Report Overview
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                    {selectedReport.description}
                                </p>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Section: Key Metrics */}
                            <div>
                                <div className="flex items-center gap-2.5 mb-4">
                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.18em]">
                                        Key Metrics
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                                    {selectedReport.metrics.map((m, i) => (
                                        <ProfileField key={i} label={m.label} value={m.value} accent={m.accent} />
                                    ))}
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Section: Report Info */}
                            <div>
                                <div className="flex items-center gap-2.5 mb-4">
                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.18em]">
                                        Report Details
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                                    <ProfileField label="Report Type" value={selectedReport.name} />
                                    <ProfileField label="Frequency" value={selectedReport.frequency} />
                                    <ProfileField label="Last Generated" value={selectedReport.lastGenerated} />
                                    <ProfileField label="File Size" value={selectedReport.size} />
                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="px-8 pb-7 flex items-center justify-between gap-4">
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-all"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => { handleExport(selectedReport); setSelectedReport(null); }}
                                className="flex items-center gap-2 px-8 py-3 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-all tracking-wide"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export Report
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default ReportsPage;
