import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import {
    RotateCcw
} from "lucide-react";
import StatCard from "../../components/common/StatCard";
import { dsrService } from "../../services/dsrService";
import { workProgressService } from "../../services/workProgressService";
import { labourService } from "../../services/labourService";
import { materialService } from "../../services/materialService";
import { issueService } from "../../services/issueService";
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
        description: "Full summary of today's site operations — labour deployed, work completed, materials consumed, and any issues logged.",
        icon: "📋",
        badgeColor: "bg-blue-50 text-blue-600",
        accentBar: "bg-blue-600",
        lastGenerated: "Today, 08:30 AM",
        size: "1.2 MB",
        frequency: "Daily",
        metrics: [
            { label: "Total Labour", value: "142 Workers", accent: "text-blue-600" },
            { label: "Concrete Poured", value: "120 Cum" },
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
            { label: "Labour Hours", value: "4,800 hrs" },
            { label: "Cost This Week", value: "₹45.2 L", accent: "text-rose-500" },
        ],
    },
    {
        id: "labour",
        name: "Labour Report",
        description: "Workforce breakdown by skill category, attendance, overtime, and contractor-wise deployment summary.",
        icon: "👷",
        badgeColor: "bg-amber-50 text-amber-600",
        accentBar: "bg-amber-500",
        lastGenerated: "Today, 07:15 AM",
        size: "0.8 MB",
        frequency: "Daily",
        metrics: [
            { label: "Skilled Labour", value: "45", accent: "text-blue-600" },
            { label: "Unskilled Labour", value: "88" },
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
            { label: "Aggregate Used", value: "320 Cum" },
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

// ─── Main Component ─────────────────────────────────────────────────────────────

const ReportsPage = () => {
    const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState("All");
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Recent" | "Large" | "Issues">("All");
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [dynamicReports, setDynamicReports] = useState<ReportType[]>(reportTypes);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
    const [projectId, setProjectId] = useState<number | null>(null);

    // Resolve Project ID from session & listen for changes
    useEffect(() => {
        const checkProject = () => {
            const userStr = localStorage.getItem("infrapilot_user");
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    const pId = user?.project_id || user?.user?.project_id;
                    if (pId && pId !== projectId) {
                        setProjectId(Number(pId));
                    } else if (!pId && projectId !== 92) {
                        setProjectId(92);
                    }
                } catch (e) {
                    console.error("Failed to resolve project ID", e);
                }
            }
        };

        checkProject();

        // Listen for tab focus to catch project changes from settings
        window.addEventListener('focus', checkProject);
        // Interval to catch same-tab changes quickly
        const interval = setInterval(checkProject, 2000);

        return () => {
            window.removeEventListener('focus', checkProject);
            clearInterval(interval);
        };
    }, [projectId]);

    const fetchReports = useCallback(async () => {
        if (!projectId) return;
        setIsInitialLoading(true);
        try {
            const updatedReports = [...reportTypes];

            // 1. Daily Report Mapping (DSR)
            try {
                const dailyRes = await dsrService.getDsrByProject(projectId, { start_date: selectedDate, end_date: selectedDate });
                const dailyIdx = updatedReports.findIndex(r => r.id === "daily");
                if (dailyIdx !== -1 && dailyRes && dailyRes.items && dailyRes.items.length > 0) {
                    // Get the most recent DSR
                    const latestDsr = dailyRes.items.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                    updatedReports[dailyIdx] = {
                        ...updatedReports[dailyIdx],
                        metrics: [
                            { label: "Total Labour", value: `${latestDsr.total_labour || 0} Workers`, accent: "text-blue-600" },
                            { label: "Skilled", value: latestDsr.skilled_labour?.toString() || "0" },
                            { label: "Weather", value: latestDsr.weather || "Clear" },
                            { label: "Location", value: latestDsr.site_location || "Site" },
                        ]
                    };
                }
            } catch (err) {
                console.warn("Failed to fetch DSR report metrics", err);
            }

            // 2. Weekly Progress Mapping (Activities)
            try {
                const weeklyRes = await workProgressService.listActivities(projectId, { start_date: selectedDate, end_date: selectedDate } as any);
                const weeklyIdx = updatedReports.findIndex(r => r.id === "weekly");
                if (weeklyIdx !== -1 && weeklyRes && weeklyRes.length > 0) {
                    const completedActivities = weeklyRes.filter((a: any) => a.completion_percentage === 100).length;
                    const totalActivities = weeklyRes.length;
                    const overallCompletion = totalActivities > 0 
                        ? Math.round((weeklyRes.reduce((acc: number, val: any) => acc + (Number(val.completion_percentage) || 0), 0)) / totalActivities)
                        : 0;
                        
                    updatedReports[weeklyIdx] = {
                        ...updatedReports[weeklyIdx],
                        metrics: [
                            { label: "Overall Completion", value: `${overallCompletion}%`, accent: "text-emerald-600" },
                            { label: "Completed Activities", value: completedActivities.toString() },
                            { label: "Total Activities", value: totalActivities.toString() },
                            { label: "Status", value: overallCompletion >= 100 ? "Completed" : "In Progress" },
                        ]
                    };
                }
            } catch (err) {
                console.warn("Failed to fetch weekly report metrics", err);
            }

            // 3. Labour Mapping (Only this API)
            try {
                const labourRes = await labourService.getLabours(projectId, { limit: 1000 } as any);
                const laborIdx = updatedReports.findIndex(r => r.id === "labour");
                if (laborIdx !== -1 && labourRes && labourRes.items) {
                    const totalPresent = labourRes.items.filter((l: any) => l.status?.toLowerCase() === 'active').length;
                    updatedReports[laborIdx] = {
                        ...updatedReports[laborIdx],
                        metrics: [
                            { label: "Total Workers", value: labourRes.items.length.toString(), accent: "text-blue-600" },
                            { label: "Active", value: totalPresent.toString() },
                            { label: "Inactive", value: (labourRes.items.length - totalPresent).toString() },
                            { label: "Shift", value: "Day" },
                        ]
                    };
                }
            } catch (err) {
                console.warn("Failed to fetch labour report metrics", err);
            }

            // 4. Material Mapping
            try {
                const materialRes = await materialService.listMaterials(projectId, { start_date: selectedDate, end_date: selectedDate } as any);
                const materialIdx = updatedReports.findIndex(r => r.id === "material");
                if (materialIdx !== -1 && materialRes && materialRes.length > 0) {
                    let totalStock = 0;
                    let totalValue = 0;
                    materialRes.forEach((m: any) => {
                        totalStock += Number(m.remaining_stock || 0);
                        totalValue += Number(m.total_amount || m.total_value || 0);
                    });
                    
                    updatedReports[materialIdx] = {
                        ...updatedReports[materialIdx],
                        metrics: [
                            { label: "Total Stock Items", value: materialRes.length.toString(), accent: "text-rose-500" },
                            { label: "Stock Qty", value: totalStock.toFixed(1) },
                            { label: "Stock Value", value: `₹${(totalValue/1000).toFixed(1)}k` },
                            { label: "Status", value: "Updated" },
                        ]
                    };
                }
            } catch (err) {
                console.warn("Failed to fetch material report metrics", err);
            }

            // 5. Issues Mapping
            try {
                const issuesRes = await issueService.getIssues({ project_id: projectId, limit: 1000 });
                const issueIdx = updatedReports.findIndex(r => r.id === "issue");
                if (issueIdx !== -1 && issuesRes && issuesRes.items) {
                    const allIssues = issuesRes.items;
                    const openIssues = allIssues.filter((i: any) => i.status !== 'Resolved' && i.status !== 'Closed').length;
                    const criticalIssues = allIssues.filter((i: any) => i.priority === 'High' || i.priority === 'Critical').length;
                    const resolvedIssues = allIssues.filter((i: any) => i.status === 'Resolved' || i.status === 'Closed').length;
                    
                    updatedReports[issueIdx] = {
                        ...updatedReports[issueIdx],
                        metrics: [
                            { label: "Open Issues", value: openIssues.toString(), accent: "text-rose-500" },
                            { label: "Critical", value: criticalIssues.toString() },
                            { label: "Resolved", value: resolvedIssues.toString() },
                            { label: "Total", value: allIssues.length.toString() },
                        ]
                    };
                }
            } catch (err) {
                console.warn("Failed to fetch issue report metrics", err);
            }

            // Simulate small delay for the rest
            await new Promise(resolve => setTimeout(resolve, 300));
            
            setDynamicReports(updatedReports);
        } catch (error) {
            console.error("Failed to fetch reports", error);
            toast.error("Failed to sync site reports");
        } finally {
            setIsInitialLoading(false);
        }
    }, [projectId, selectedDate]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleExportCSV = () => {
        const headers = [
            "Report Name",
            "Description",
            "Frequency",
            "File Size",
            "Last Generated",
            "Metric 1",
            "Metric 2",
            "Metric 3",
            "Metric 4"
        ];
        const escape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;

        const rows = filtered.map((r: ReportType) => {
            const rowData = [
                escape(r.name),
                escape(r.description),
                escape(r.frequency),
                escape(r.size),
                escape(r.lastGenerated)
            ];

            // Add up to 4 metrics
            for (let i = 0; i < 4; i++) {
                const metric = r.metrics[i];
                if (metric) {
                    rowData.push(escape(`${metric.label}: ${metric.value}`));
                } else {
                    rowData.push(escape("—"));
                }
            }

            return rowData.join(",");
        });

        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Site_Reports_Summary_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Excel report exported successfully");
    };

    const handleExportPDF = () => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            toast.error("Popup blocker blocked print preview. Please allow popups.");
            return;
        }

        const dateStr = new Date(selectedDate).toLocaleDateString("en-US", {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const reportRowsHtml = filtered.map((r: ReportType) => {
            const metricsHtml = r.metrics.map((m) => `
                <div class="metric-box">
                    <div class="metric-label">${m.label.toUpperCase()}</div>
                    <div class="metric-value">${m.value}</div>
                </div>
            `).join("");

            return `
                <div class="report-card">
                    <div class="report-header">
                        <div class="report-title-group">
                            <span class="report-icon">${r.icon}</span>
                            <div>
                                <div class="report-freq">${r.frequency.toUpperCase()}</div>
                                <h3 class="report-name">${r.name}</h3>
                            </div>
                        </div>
                        <div class="report-size">${r.size}</div>
                    </div>
                    <p class="report-desc">${r.description}</p>
                    <div class="metrics-grid">
                        ${metricsHtml}
                    </div>
                    <div class="report-footer">
                        <span class="status-dot"></span>
                        <span>Generated: ${r.lastGenerated}</span>
                    </div>
                </div>
            `;
        }).join("");

        printWindow.document.write(`
            <html>
            <head>
                <title>Site Operations Reports Summary</title>
                <style>
                    body {
                        font-family: 'Inter', system-ui, -apple-system, sans-serif;
                        color: #1e293b;
                        background: #fff;
                        margin: 40px;
                        padding: 0;
                    }
                    .header {
                        border-bottom: 2px solid #e2e8f0;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .brand {
                        font-size: 10px;
                        font-weight: 800;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.15em;
                    }
                    .title {
                        font-size: 26px;
                        font-weight: 800;
                        color: #0f172a;
                        margin: 5px 0 10px 0;
                        letter-spacing: -0.02em;
                    }
                    .subtitle {
                        font-size: 12px;
                        color: #64748b;
                        margin: 0;
                        font-weight: 500;
                    }
                    .meta-info {
                        margin-top: 15px;
                        font-size: 11px;
                        font-weight: 700;
                        color: #3b82f6;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }
                    .report-card {
                        border: 1px solid #e2e8f0;
                        border-radius: 16px;
                        padding: 20px;
                        margin-bottom: 25px;
                        page-break-inside: avoid;
                        background: #f8fafc;
                    }
                    .report-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 12px;
                    }
                    .report-title-group {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }
                    .report-icon {
                        font-size: 24px;
                    }
                    .report-freq {
                        font-size: 9px;
                        font-weight: 800;
                        color: #64748b;
                        letter-spacing: 0.1em;
                    }
                    .report-name {
                        font-size: 16px;
                        font-weight: 800;
                        color: #0f172a;
                        margin: 2px 0 0 0;
                    }
                    .report-size {
                        font-size: 11px;
                        font-weight: 700;
                        color: #64748b;
                    }
                    .report-desc {
                        font-size: 12px;
                        color: #475569;
                        line-height: 1.6;
                        margin: 0 0 15px 0;
                    }
                    .metrics-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 15px;
                        padding: 15px 0;
                        border-top: 1px dashed #e2e8f0;
                        border-bottom: 1px dashed #e2e8f0;
                        margin-bottom: 12px;
                    }
                    .metric-box {
                        display: flex;
                        flex-direction: column;
                    }
                    .metric-label {
                        font-size: 8px;
                        font-weight: 800;
                        color: #64748b;
                        letter-spacing: 0.1em;
                        margin-bottom: 2px;
                    }
                    .metric-value {
                        font-size: 12px;
                        font-weight: 700;
                        color: #0f172a;
                    }
                    .report-footer {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 10px;
                        font-weight: 700;
                        color: #64748b;
                    }
                    .status-dot {
                        width: 6px;
                        height: 6px;
                        background: #10b981;
                        border-radius: 50%;
                    }
                    @media print {
                        body {
                            margin: 20px;
                        }
                        .report-card {
                            background: #fff !important;
                            border: 1px solid #cbd5e1 !important;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="brand">InfraPilot Operational Intelligence</div>
                    <h1 class="title">Operational Reports Register</h1>
                    <p class="subtitle">Exported document listing site status, performance audits, and resource metrics.</p>
                    <div class="meta-info">As of: ${dateStr}</div>
                </div>
                
                <div class="report-list">
                    ${reportRowsHtml}
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
        toast.success("PDF Print dialog opened successfully!");
    };

    const handleCardPDF = async (report: ReportType) => {
        setLoadingId(`pdf-${report.id}`);
        toast.loading(`Fetching data for ${report.name}...`, { id: `pdf-${report.id}` });
        try {
            const today = new Date();
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const year = today.getFullYear().toString();
            
            // Map our report.id to backend types: ["daily", "weekly", "monthly", "quarterly"]
            let mappedType = "monthly";
            if (report.id === "daily") mappedType = "daily";
            if (report.id === "weekly") mappedType = "weekly";
            
            const reportData = await reportService.getProjectReportData(projectId || 1, mappedType, month, year);
            
            // Usually we'd pass this data to a PDF generator, but for now we fallback to our generic print
            console.log("Successfully fetched report data for PDF:", reportData);
            toast.dismiss(`pdf-${report.id}`);
            handleExportPDF();
            
        } catch (err) {
            console.error("Failed to fetch report data", err);
            toast.error("Failed to fetch report data", { id: `pdf-${report.id}` });
        } finally {
            setLoadingId(null);
        }
    };

    const handleExport = async (report: ReportType) => {
        setLoadingId(report.id);
        toast.loading(`Exporting ${report.name}...`, { id: `exp-${report.id}` });
        try {
            const today = new Date();
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const year = today.getFullYear().toString();
            
            let mappedType = "monthly";
            if (report.id === "daily") mappedType = "daily";
            if (report.id === "weekly") mappedType = "weekly";

            const reportData = await reportService.getProjectReportData(projectId || 1, mappedType, month, year);
            
            // Dump the JSON to an excel/text file for now as a placeholder for actual excel generation
            const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
            const filename = `${report.name}_Report_${year}-${month}.json`;

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success(`${report.name} exported!`, { id: `exp-${report.id}` });
        } catch (e) {
            console.error("Export failed", e);
            toast.error("Export failed", { id: `exp-${report.id}` });
        } finally {
            setLoadingId(null);
        }
    };

    const filtered = useMemo(() => {
        let data = activeFilter === "All"
            ? dynamicReports
            : dynamicReports.filter(r => r.frequency === activeFilter);

        if (activeStatFilter === "Recent") {
            data = data.filter(r => r.lastGenerated.toLowerCase().includes("today"));
        } else if (activeStatFilter === "Large") {
            data = data.filter(r => parseFloat(r.size) > 1.5);
        } else if (activeStatFilter === "Issues") {
            data = data.filter(r => r.id === "issue");
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            data = data.filter(r => 
                r.name.toLowerCase().includes(term) || 
                r.description.toLowerCase().includes(term) ||
                r.frequency.toLowerCase().includes(term)
            );
        }

        return data;
    }, [activeFilter, activeStatFilter, dynamicReports, searchTerm]);

    const reportsStats = useMemo(() => {
        const total = dynamicReports.length;
        const generatedToday = dynamicReports.filter(r => r.lastGenerated.toLowerCase().includes("today")).length;

        // Find issue report and extract open issues count
        const issueReport = dynamicReports.find(r => r.id === "issue");
        // Look for metric that contains "Open Issue" in label
        const openIssuesMetric = issueReport?.metrics.find(m => m.label.includes("Open Issue"));
        const openIssues = openIssuesMetric ? parseInt(openIssuesMetric.value.replace(/[^0-9]/g, "")) || 0 : 0;

        // Calculate total size
        const totalSize = dynamicReports.reduce((acc, r) => acc + parseFloat(r.size || "0"), 0);
        const avgSize = total > 0 ? (totalSize / total).toFixed(1) : "0";

        return { total, generatedToday, openIssues, avgSize };
    }, [dynamicReports]);

    return (
        <>
            <Navbar
                title="Reports"
                breadcrumb={["InfraPilot", "Engineer", "Reports"]}
            />

            <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter flex flex-col pb-8">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 md:mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Site Engineer
                        </p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Reports
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Generate, view, and export daily, weekly, labour, material, and issue reports.
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
                    <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                        Report Overview
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary bg-primary/5 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                            <StatCard
                                title="Total Reports"
                                value={reportsStats.total.toString()}
                                sub="Available in Catalog"
                                accent="text-primary" />
                        </div>
                        <div onClick={() => setActiveStatFilter("Recent")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Recent" ? "ring-2 ring-emerald-500 bg-emerald-50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                            <StatCard
                                title="Generated Today"
                                value={reportsStats.generatedToday.toString()}
                                sub="Recent Site Logs"
                                accent="text-emerald-500" />
                        </div>
                        <div onClick={() => setActiveStatFilter("Large")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Large" ? "ring-2 ring-amber-500 bg-amber-50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                            <StatCard
                                title="Avg. Report Size"
                                value={`${reportsStats.avgSize} MB`}
                                sub="Inventory Volume"
                                accent="text-amber-500" />
                        </div>
                        <div onClick={() => setActiveStatFilter("Issues")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Issues" ? "ring-2 ring-rose-500 bg-rose-50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                            <StatCard
                                title="Open Issues"
                                value={reportsStats.openIssues.toString()}
                                sub="High Priority Items"
                                accent="text-rose-500" />
                        </div>
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
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Search</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search reports..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div className="flex flex-col gap-0.5 min-w-[150px]">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Report Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none transition-all cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Filter Dropdown */}
                    <div className="flex flex-col gap-0.5 min-w-[150px]">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Frequency</label>
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
                            </select>
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </div>
                    </div>

                    {activeStatFilter !== "All" && (
                        <button onClick={() => setActiveStatFilter("All")} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    )}

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
                <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 pr-2">

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((report: ReportType) => (
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
                                            <h3 className="text-base font-bold text-slate-800 leading-tight">
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
                                    {report.metrics.map((m: ReportMetric, i: number) => (
                                        <div key={i}>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{m.label}</p>
                                            <p className={`text-sm font-bold text-slate-800 ${m.accent ?? ""}`}>{m.value}</p>
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
                                        {/* PDF button */}
                                        <button
                                            onClick={() => handleCardPDF(report)}
                                            disabled={loadingId === `pdf-${report.id}`}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-60 text-rose-600 text-xs font-bold rounded-xl transition-all shadow-sm"
                                        >
                                            {loadingId === `pdf-${report.id}` ? (
                                                <span className="w-3.5 h-3.5 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin" />
                                            ) : (
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            )}
                                            PDF
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
                                            Excel
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
                    <div className="bg-white p-6 text-inter">
                        {/* ── Blue Hero Card ────────────────────────────────── */}
                        <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />

                            <div className="relative z-10">
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Analytics Registry</p>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-bold tracking-tight leading-tight">{selectedReport.name}</h3>
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl">
                                        {selectedReport.icon}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">File Context</p>
                                        <p className="text-xl font-bold">{selectedReport.size}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Frequency</p>
                                        <p className="text-xl font-bold">{selectedReport.frequency.toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Diagnostic Floor ──────────────────────────────── */}
                        <div className="space-y-8 mb-10 px-1">
                            {/* Report Identity */}
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Report Identity</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-6 sm:gap-x-12">
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description & Scope</p>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed font-inter italic">{selectedReport.description}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Last Generated</p>
                                        <p className="text-sm font-bold text-slate-800 tabular-nums">{selectedReport.lastGenerated}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">System Status</p>
                                        <p className="text-sm font-bold text-emerald-600">VERIFIED / READY</p>
                                    </div>
                                </div>
                            </div>

                            {/* Logic Summary */}
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Performance Metrics</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-6 sm:gap-x-12">
                                    {selectedReport.metrics.map((m: ReportMetric, i: number) => (
                                        <div key={i}>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{m.label.toUpperCase()}</p>
                                            <p className={`text-sm font-bold ${m.accent || "text-slate-800"}`}>{m.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Report Metadata</p>
                                <p className="text-xs font-medium text-slate-600 leading-relaxed italic bg-slate-50 p-4 rounded-2xl border border-slate-100 uppercase tracking-tight">
                                    Generation Logic: Standardized System Export | Integrity: 100% SECURE
                                </p>
                            </div>
                        </div>

                        {/* ── Action Footer ─────────────────────────────────── */}
                        <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-bold rounded-2xl transition-all uppercase tracking-widest"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default ReportsPage;
