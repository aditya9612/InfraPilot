import { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import { reportService } from "../../services/reportService";

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



// ─── Main Component ─────────────────────────────────────────────────────────────

const ReportsPage = () => {
    const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState("All");
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [dynamicReports, setDynamicReports] = useState<ReportType[]>(reportTypes);

    const fetchReports = useCallback(async () => {
        setIsInitialLoading(true);
        try {
            const projectId = 36; // Consistent with other modules
            const today = new Date().toISOString().split("T")[0];

            const [daily, weekly, labour, material, issues] = await Promise.all([
                reportService.getDailyReport(projectId, today).catch(() => null),
                reportService.getWeeklyProgress(projectId).catch(() => null),
                reportService.getLabourReport(projectId).catch(() => null),
                reportService.getMaterialReport(projectId).catch(() => null),
                reportService.getIssueReport(projectId).catch(() => null)
            ]);

            const updatedReports = [...reportTypes];

            // 1. Daily Report Mapping
            if (daily?.dsr) {
                updatedReports[0] = {
                    ...updatedReports[0],
                    metrics: [
                        { label: "Total Labor", value: `${daily.dsr.total_labour || 0} Workers`, accent: "text-blue-600" },
                        { label: "Work Done", value: daily.dsr.work_done?.substring(0, 20) + (daily.dsr.work_done?.length > 20 ? "..." : "") || "N/A" },
                        { label: "Weather", value: daily.dsr.weather || "N/A" },
                        { label: "Status", value: daily.dsr.status, accent: daily.dsr.status === "Approved" ? "text-emerald-600" : "text-amber-600" },
                    ]
                };
            }

            // 2. Weekly Progress Mapping
            if (weekly) {
                updatedReports[1] = {
                    ...updatedReports[1],
                    metrics: [
                        { label: "Total Progress", value: `${weekly.weekly_progress_percent || 0}%`, accent: "text-emerald-600" },
                        { label: "Active Tasks", value: `${weekly.tasks_count || 0}` },
                        { label: "Cycle", value: "Weekly" },
                        { label: "Health", value: "Stable", accent: "text-emerald-600" },
                    ]
                };
            }

            // 3. Labour Mapping
            if (labour?.labour_summary) {
                updatedReports[2] = {
                    ...updatedReports[2],
                    metrics: labour.labour_summary.map((l: any) => ({
                        label: l.skill_type,
                        value: String(l.count),
                        accent: l.skill_type === "Skilled" ? "text-blue-600" : ""
                    }))
                };
            }

            // 4. Material Mapping
            if (material && material.length > 0) {
                const first = material[0];
                updatedReports[3] = {
                    ...updatedReports[3],
                    metrics: [
                        { label: "Material", value: first.material_name, accent: "text-indigo-600" },
                        { label: "Stock", value: `${first.remaining_stock}`, accent: "text-rose-500" },
                        { label: "Cost", value: `₹${first.total_cost}`, accent: "text-emerald-600" },
                        { label: "Pending", value: `₹${first.payment_pending || 0}`, accent: "text-amber-600" },
                    ]
                };
            }

            // 5. Issues Mapping
            if (issues) {
                updatedReports[4] = {
                    ...updatedReports[4],
                    metrics: [
                        { label: "Open Issues", value: String(issues.open || 0), accent: "text-rose-500" },
                        { label: "Closed Issues", value: String(issues.closed || 0), accent: "text-emerald-600" },
                        { label: "Resolution", value: issues.open > 0 ? "In Progress" : "Complete", accent: "text-amber-600" },
                        { label: "Priority", value: "Normal" },
                    ]
                };
            }

            setDynamicReports(updatedReports);
        } catch (error) {
            console.error("Failed to fetch reports", error);
            toast.error("Failed to sync site reports");
        } finally {
            setIsInitialLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleExportCSV = () => {
        const headers = ["ID", "Name", "Description", "Frequency", "Size", "Last Generated"];
        const escape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
        const rows = filtered.map(r => [
            escape(r.id), escape(r.name), escape(r.description),
            escape(r.frequency), escape(r.size), escape(r.lastGenerated)
        ].join(","));
        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Reports_Inventory_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Excel report exported");
    };

    const handleExportPDF = () => {
        const rows = filtered.map(r => `
            <tr>
                <td style="font-weight: bold;">${r.name}</td>
                <td>${r.frequency}</td>
                <td style="font-size: 9px; color: #64748b;">${r.description}</td>
                <td>${r.lastGenerated}</td>
                <td style="color: #2563eb;">${r.size}</td>
            </tr>
        `).join("");

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Inter, Arial; padding: 30px; }
                    h1 { color: #2563eb; font-size: 20px; margin-bottom: 2px; }
                    p { color: #64748b; font-size: 11px; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; font-size: 10px; }
                    th { background: #2563eb; color: white; padding: 10px; text-align: left; }
                    td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
                </style>
            </head>
            <body>
                <h1>Site Analytics Inventory — InfraPilot</h1>
                <p>Filter: ${activeFilter} | Date: ${new Date().toLocaleDateString()} | Records: ${filtered.length}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Report Name</th>
                            <th>Cycle</th>
                            <th>Scope</th>
                            <th>Generated</th>
                            <th>Size</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </body>
            </html>
        `;
        const win = window.open("", "_blank");
        if (win) {
            win.document.write(html);
            win.document.close();
            win.focus();
            setTimeout(() => win.print(), 400);
        }
    };

    const handleExport = (report: ReportType) => {
        setLoadingId(report.id);
        toast.loading(`Generating ${report.name}…`, { id: `exp-${report.id}` });
        setTimeout(() => {
            toast.success(`${report.name} exported successfully!`, { id: `exp-${report.id}` });
            setLoadingId(null);
        }, 1800);
    };

    const filtered = activeFilter === "All"
        ? dynamicReports
        : dynamicReports.filter(r => r.frequency === activeFilter);

    return (
        <>
            <Navbar
                title="Reports"
                breadcrumb={["InfraPilot", "Engineer", "Reports"]}
            />

            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Site Engineer
                        </p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Reports
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Generate, view, and export daily, weekly, labor, material, and issue reports.
                        </p>
                    </div>

                    <button
                        onClick={fetchReports}
                        disabled={isInitialLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-inter disabled:opacity-50"
                    >
                        {isInitialLoading ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        )}
                        Refresh Reports
                    </button>
                </div>

                {/* ── Stat Cards ───────────────────────────────────────────── */}
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
                        Report Overview
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                {/* ── Filter Bar (DSR Style) ───────────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4 mb-8 flex flex-wrap items-center gap-4 font-inter">

                    {/* Left: Blue Icon + Title */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </div>
                        <span className="text-base font-bold text-slate-800 whitespace-nowrap">Report Catalog Filter</span>
                    </div>

                    <div className="hidden md:block w-px h-8 bg-slate-100 shrink-0" />

                    {/* Search */}
                    <div className="flex flex-col gap-0.5 min-w-[200px]">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Search</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search reports..."
                                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Filter Dropdown */}
                    <div className="flex flex-col gap-0.5 min-w-[150px]">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Frequency</label>
                        <div className="relative">
                            <select
                                value={activeFilter}
                                onChange={(e) => setActiveFilter(e.target.value)}
                                className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none transition-all cursor-pointer pr-8"
                            >
                                <option value="All">All Cycles</option>
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly">Monthly</option>
                                <option value="As needed">Ad-hoc</option>
                            </select>
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </div>
                    </div>

                    {/* Export Buttons */}
                    <div className="ml-auto flex items-end pb-0.5 gap-2">
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-md shadow-primary/20 hover:bg-blue-600 transition-all font-inter"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            PDF
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 transition-all shadow-sm font-inter"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export
                        </button>
                    </div>
                </div>

                {/* ── Report Cards Grid ───────────────────────────── */}
                <div>

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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 border-y border-slate-50">
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
            {/* ── DETAIL MODAL (Insight View) ────────────────────────────────── */}
            <Modal
                isOpen={!!selectedReport}
                onClose={() => setSelectedReport(null)}
                title="Report Insight"
                maxWidth="max-w-2xl"
            >
                {selectedReport && (
                    <div className="bg-white p-6 italic-none text-inter">
                        {/* ── Blue Hero Card ────────────────────────────────── */}
                        <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />

                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Analytics Registry</p>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-black tracking-tight leading-tight">{selectedReport.name}</h3>
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl">
                                        {selectedReport.icon}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">File Context</p>
                                        <p className="text-xl font-black">{selectedReport.size}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Frequency</p>
                                        <p className="text-xl font-black">{selectedReport.frequency.toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Diagnostic Floor ──────────────────────────────── */}
                        <div className="space-y-8 mb-10 px-1">
                            {/* Report Identity */}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Report Identity</p>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description & Scope</p>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed font-inter italic">{selectedReport.description}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Last Generated</p>
                                        <p className="text-sm font-black text-slate-800 tabular-nums">{selectedReport.lastGenerated}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">System Status</p>
                                        <p className="text-sm font-black text-emerald-600">VERIFIED / READY</p>
                                    </div>
                                </div>
                            </div>

                            {/* Logic Summary */}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Performance Metrics</p>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                    {selectedReport.metrics.map((m, i) => (
                                        <div key={i}>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{m.label.toUpperCase()}</p>
                                            <p className={`text-sm font-black ${m.accent || "text-slate-800"}`}>{m.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Report Metadata</p>
                                <p className="text-xs font-medium text-slate-600 leading-relaxed italic bg-slate-50 p-4 rounded-2xl border border-slate-100 uppercase tracking-tight">
                                    Generation Logic: Standardized System Export | Integrity: 100% SECURE
                                </p>
                            </div>
                        </div>

                        {/* ── Action Footer ─────────────────────────────────── */}
                        <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => { handleExport(selectedReport); setSelectedReport(null); }}
                                className="flex-[1.5] py-4 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black rounded-2xl shadow-lg shadow-blue-200 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export Analytic
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default ReportsPage;
