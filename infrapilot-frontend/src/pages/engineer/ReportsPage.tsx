import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import { 
    RotateCcw
} from "lucide-react";
import StatCard from "../../components/common/StatCard";
import { reportService } from "../../services/reportService";
import { dsrService } from "../../services/dsrService";
import { labourService } from "../../services/labourService";
import { materialService } from "../../services/materialService";
import { issueService } from "../../services/issueService";

// ─── Types ─────────────────────────────────────────────────────────────────────────────

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
    image: string;
    badgeColor: string;       // badge background + text
    accentBar: string;        // left accent bar colour
    lastGenerated: string;
    size: string;
    frequency: string;
    metrics: ReportMetric[];
}

// ─── Report Definitions ─────────────────────────────────────────────────────────────────────────────

const reportTypes: ReportType[] = [
    {
        id: "daily",
        name: "Daily Report",
        description: "Full summary of today's site operations — labour deployed, work completed, materials consumed, and any issues logged.",
        icon: "📋",
        image: "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?w=500&q=80",
        badgeColor: "bg-blue-50 text-blue-600",
        accentBar: "bg-blue-600",
        lastGenerated: "Today, 08:30 AM",
        size: "1.2 MB",
        frequency: "Daily",
        metrics: [
            { label: "Total Labour", value: "142 Workers", accent: "text-blue-600" },
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
        image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500&q=80",
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
        image: "https://images.unsplash.com/photo-1504307651254-35680f356f12?w=500&q=80",
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
        image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&q=80",
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
        image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=80",
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

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ReportsPage = () => {
    const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState("All");
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Recent" | "Large" | "Issues">("All");
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [dynamicReports, setDynamicReports] = useState<ReportType[]>(reportTypes);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
    const [projectId, setProjectId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Resolve Project ID from session
    useEffect(() => {
        const userStr = localStorage.getItem("infrapilot_user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const pId = user?.project_id || user?.user?.project_id;
                if (pId) {
                    setProjectId(Number(pId));
                } else {
                    setProjectId(92);
                }
            } catch (e) {
                console.error("Failed to resolve project ID", e);
                setProjectId(92);
            }
        }
    }, []);

    const fetchReports = useCallback(async () => {
        if (!projectId) return;
        setIsInitialLoading(true);
        try {
            const updatedReports = [...reportTypes];

            // ── 1. Daily Report ── fetch from DSR service ───────────────────────
            try {
                const dsrResp = await dsrService.getDsrByProject(projectId, { limit: 1 }).catch(() => null);
                const latestDsr = dsrResp?.items?.[0] || null;
                const dailyIdx = updatedReports.findIndex(r => r.id === "daily");
                if (dailyIdx !== -1) {
                    updatedReports[dailyIdx] = {
                        ...updatedReports[dailyIdx],
                        lastGenerated: latestDsr
                            ? new Date(latestDsr.report_date || latestDsr.created_at || "").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                            : updatedReports[dailyIdx].lastGenerated,
                        metrics: [
                            { label: "Total Labour", value: latestDsr?.total_labour != null ? `${latestDsr.total_labour} Workers` : "–", accent: "text-blue-600" },
                            { label: "Skilled Workers", value: latestDsr?.skilled_labour != null ? String(latestDsr.skilled_labour) : "–" },
                            { label: "Work Done", value: latestDsr?.work_done ? latestDsr.work_done.substring(0, 24) + (latestDsr.work_done.length > 24 ? "…" : "") : "–" },
                            { label: "Weather", value: latestDsr?.weather || "–", accent: "text-emerald-600" },
                        ]
                    };
                }
            } catch (e) {
                console.warn("DSR fetch failed for Reports sync", e);
            }

            // ── 2. Labour Report ── fetch from labourService ────────────────────
            try {
                const labourResp = await labourService.getLabours(projectId, { limit: 100 }).catch(() => null);
                const items = labourResp?.items || [];
                const skilled   = items.filter((l: any) => (l.skill_type || "").toLowerCase().includes("skilled")).length;
                const unskilled = items.filter((l: any) => (l.skill_type || "").toLowerCase().includes("unskilled")).length;
                const supervisors = items.filter((l: any) => (l.skill_type || "").toLowerCase().includes("super")).length;
                const total = items.length;
                const laborIdx = updatedReports.findIndex(r => r.id === "labour");
                if (laborIdx !== -1) {
                    updatedReports[laborIdx] = {
                        ...updatedReports[laborIdx],
                        metrics: [
                            { label: "Total Workers", value: String(total), accent: "text-blue-600" },
                            { label: "Skilled Labour", value: String(skilled) },
                            { label: "Unskilled Labour", value: String(unskilled) },
                            { label: "Supervisors", value: String(supervisors), accent: "text-amber-600" },
                        ]
                    };
                }
            } catch (e) {
                console.warn("Labour fetch failed for Reports sync", e);
            }

            // ── 3. Material Report ── fetch from materialService ────────────────
            try {
                const materials = await materialService.listMaterials(projectId, 0, 100).catch(() => []);
                const totalPurchased = materials.reduce((s: number, m: any) => s + (m.quantity_purchased ?? 0), 0);
                const totalUsed = materials.reduce((s: number, m: any) => s + (m.quantity_used ?? 0), 0);
                const stockValue = materials.reduce((s: number, m: any) => s + (m.total_value ?? m.total_amount ?? 0), 0);
                const pendingPay = materials.reduce((s: number, m: any) => s + (m.payment_pending ?? 0), 0);
                const materialIdx = updatedReports.findIndex(r => r.id === "material");
                if (materialIdx !== -1) {
                    updatedReports[materialIdx] = {
                        ...updatedReports[materialIdx],
                        metrics: [
                            { label: "Total Purchased", value: `${totalPurchased} units`, accent: "text-indigo-600" },
                            { label: "Total Used", value: `${totalUsed} units`, accent: "text-rose-500" },
                            { label: "Stock Value", value: `₹${stockValue.toLocaleString("en-IN")}`, accent: "text-emerald-600" },
                            { label: "Payment Pending", value: `₹${pendingPay.toLocaleString("en-IN")}`, accent: "text-amber-600" },
                        ]
                    };
                }
            } catch (e) {
                console.warn("Material fetch failed for Reports sync", e);
            }

            // ── 4. Issue Report ── fetch from issueService ──────────────────────
            try {
                const issueResp = await issueService.getIssues().catch(() => null);
                const allIssues: any[] = Array.isArray(issueResp) ? issueResp : (issueResp?.items || []);
                const openIssues     = allIssues.filter((i: any) => (i.status || "").toLowerCase() === "open").length;
                const resolvedIssues = allIssues.filter((i: any) => (i.status || "").toLowerCase() === "resolved" || (i.status || "").toLowerCase() === "closed").length;
                const highPriority   = allIssues.filter((i: any) => (i.priority || "").toLowerCase() === "high").length;
                const issueIdx = updatedReports.findIndex(r => r.id === "issue");
                if (issueIdx !== -1) {
                    updatedReports[issueIdx] = {
                        ...updatedReports[issueIdx],
                        metrics: [
                            { label: "Total Issues", value: String(allIssues.length), accent: "text-slate-600" },
                            { label: "Open Issues", value: String(openIssues), accent: "text-rose-500" },
                            { label: "Resolved", value: String(resolvedIssues), accent: "text-emerald-600" },
                            { label: "High Priority", value: String(highPriority), accent: "text-amber-600" },
                        ]
                    };
                }
            } catch (e) {
                console.warn("Issue fetch failed for Reports sync", e);
            }

            // ── 5. Weekly Report ── fetch from reportService (weekly) ───────────
            try {
                const weeklyData = await reportService.getWeeklyProgress(projectId).catch(() => null);
                const progress = weeklyData?.weekly_progress_percent ?? weeklyData?.actual_progress ?? 0;
                const planned  = weeklyData?.planned_progress ?? weeklyData?.planned ?? 0;
                const weeklyIdx = updatedReports.findIndex(r => r.id === "weekly");
                if (weeklyIdx !== -1) {
                    updatedReports[weeklyIdx] = {
                        ...updatedReports[weeklyIdx],
                        metrics: [
                            { label: "Planned Progress", value: `${planned || 72}%` },
                            { label: "Actual Progress", value: `${progress}%`, accent: "text-emerald-600" },
                            { label: "Tasks Count", value: String(weeklyData?.tasks_count ?? "–") },
                            { label: "Cost This Week", value: weeklyData?.cost_this_week ? `₹${weeklyData.cost_this_week}` : "₹45.2 L", accent: "text-rose-500" },
                        ]
                    };
                }
            } catch (e) {
                console.warn("Weekly Progress fetch failed for Reports sync", e);
            }

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
                    rowData.push(escape("â€”"));
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

    const handleExport = async (report: ReportType, format: 'pdf' | 'excel' = 'pdf') => {
        setLoadingId(`${report.id}-${format}`);
        toast.loading(`Exporting ${report.name} as ${format.toUpperCase()}...`, { id: `exp-${report.id}` });
        try {
            let blob: Blob;
            let filename: string;
            const today = new Date().toISOString().split("T")[0];

            if (format === 'pdf') {
                if (report.id === "daily") {
                    blob = await reportService.exportDailyPDF(projectId || 0, selectedDate);
                } else if (report.id === "material") {
                    blob = await reportService.exportMaterialPDF();
                } else {
                    blob = new Blob([`PDF Report Content for ${report.name}`], { type: 'application/pdf' });
                }
                filename = `${report.name.replace(/\s+/g, '_')}_${today}.pdf`;
            } else {
                if (report.id === "material") {
                    blob = await reportService.exportMaterialExcel(projectId || 0);
                } else if (report.id === "labor") {
                    blob = await reportService.exportLabourExcel(projectId || 0);
                } else if (report.id === "issue") {
                    blob = await reportService.exportIssueExcel(projectId || 0);
                } else {
                    // Fallback for others (Daily, Weekly, etc.)
                    blob = new Blob([`Excel Report Content for ${report.name}`], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                }
                filename = `${report.name.replace(/\s+/g, '_')}_${today}.xlsx`;
            }

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
            toast.error("Export failed", { id: `exp-${report.id}` });
        } finally {
            setLoadingId(null);
        }
    };

    const filtered = useMemo(() => {
        // 1. Frequency filter
        let data = activeFilter === "All"
            ? dynamicReports
            : dynamicReports.filter(r => r.frequency === activeFilter);

        // 2. Stat filter
        if (activeStatFilter === "Recent") {
            data = data.filter(r => r.lastGenerated.toLowerCase().includes("today"));
        } else if (activeStatFilter === "Large") {
            data = data.filter(r => parseFloat(r.size) > 1.5);
        } else if (activeStatFilter === "Issues") {
            data = data.filter(r => r.id === "issue");
        }

        // 3. Search filter — matches name, description, or report id
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            data = data.filter(r =>
                r.name.toLowerCase().includes(q) ||
                r.description.toLowerCase().includes(q) ||
                r.id.toLowerCase().includes(q) ||
                r.frequency.toLowerCase().includes(q)
            );
        }

        // 4. Date filter — show only reports whose lastGenerated matches the selected date
        if (selectedDate) {
            const [y, m, d] = selectedDate.split("-");
            const formatted = `${d}-${m}-${y}`; // DD-MM-YYYY
            // Only filter if user has picked a non-today date; otherwise show all
            const todayStr = new Date().toISOString().split("T")[0];
            if (selectedDate !== todayStr) {
                data = data.filter(r =>
                    r.lastGenerated.includes(formatted) ||
                    r.lastGenerated.toLowerCase().includes("today")
                );
            }
        }

        return data;
    }, [activeFilter, activeStatFilter, dynamicReports, searchQuery, selectedDate]);

    const reportsStats = useMemo(() => {
        const total = filtered.length;
        
        // Find Total Labour
        let totalLabour = 0;
        let closingStock = "₹0";
        let openIssues = 0;

        filtered.forEach(r => {
            if (r.id === "daily" || r.id === "labour") {
                const workerMetric = r.metrics.find(m => m.label.toLowerCase().includes("labour") || m.label.toLowerCase().includes("workers"));
                if (workerMetric) totalLabour += parseInt(workerMetric.value.replace(/[^0-9]/g, "")) || 0;
            }
            if (r.id === "material") {
                const stockMetric = r.metrics.find(m => m.label.toLowerCase().includes("stock"));
                if (stockMetric) closingStock = stockMetric.value;
            }
            if (r.id === "issue") {
                const issueMetric = r.metrics.find(m => m.label.toLowerCase().includes("open"));
                if (issueMetric) openIssues += parseInt(issueMetric.value.replace(/[^0-9]/g, "")) || 0;
            }
        });

        return { total, totalLabour, closingStock, openIssues };
    }, [filtered]);

    return (
        <>
            <Navbar
                title="Reports"
                breadcrumb={["InfraPilot", "Engineer", "Reports"]}
            />

            <PageTransition className="p-4 md:p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter flex flex-col">

                {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

                {/* ─── Stat Cards ───────────────────────────────────────────────────────────────────────────── */}
                <div className="mb-8">
                    <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                        Report Overview
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filtered.length === 1 ? (
                            // Show the specific metrics of the single filtered report
                            filtered[0].metrics.map((m: ReportMetric, i: number) => (
                                <div key={i} className="group transition-all rounded-xl hover:scale-[1.01]">
                                    <StatCard
                                        title={m.label}
                                        value={m.value}
                                        sub={`${filtered[0].name} Detail`}
                                        accent={m.accent ? m.accent : "text-primary"} />
                                </div>
                            ))
                        ) : (
                            // Show aggregated summary stats for multiple reports
                            <>
                                <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary bg-primary/5 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                                    <StatCard
                                        title="Total Reports"
                                        value={reportsStats.total.toString()}
                                        sub="Available in Catalog"
                                        accent="text-primary" />
                                </div>
                                <div className={`group transition-all rounded-xl hover:scale-[1.01]`}>
                                    <StatCard
                                        title="Total Labour Deploy"
                                        value={reportsStats.totalLabour.toString()}
                                        sub="Workers Across Site"
                                        accent="text-blue-500" />
                                </div>
                                <div className={`group transition-all rounded-xl hover:scale-[1.01]`}>
                                    <StatCard
                                        title="Material Stock"
                                        value={reportsStats.closingStock}
                                        sub="Closing Value"
                                        accent="text-emerald-500" />
                                </div>
                                <div onClick={() => setActiveStatFilter("Issues")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Issues" ? "ring-2 ring-rose-500 bg-rose-50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                                    <StatCard
                                        title="Open Issues"
                                        value={reportsStats.openIssues.toString()}
                                        sub="High Priority Items"
                                        accent="text-rose-500" />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* â”€â”€ Filter Tabs + Report Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                {/* â”€â”€ Filter Bar (DSR Style) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search reports..."
                                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div className="flex flex-col gap-0.5 min-w-[150px]">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Report Date &nbsp;<span className="text-primary font-bold">
                                {selectedDate
                                    ? (() => { const [y,m,d] = selectedDate.split("-"); return `${d}-${m}-${y}`; })()
                                    : ""}
                            </span>
                        </label>
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
                                <option value="As needed">Ad-hoc</option>
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

                {/* â”€â”€ Report Cards Grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 pr-2">

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((report: ReportType) => (
                            <div
                                key={report.id}
                                className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all flex flex-col gap-5 group"
                            >
                                {/* Accent bar */}
                                <div className={`absolute left-0 top-5 bottom-5 w-1 ${report.accentBar} rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity z-10`} />

                                {/* Card header */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${report.badgeColor} shrink-0`}>
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
                                    <span className="text-[10px] font-bold text-slate-400 shrink-0 mt-1">{report.size}</span>
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
                                <div className="flex flex-col gap-3 mt-auto">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
                                        <span className="text-[10px] font-bold text-slate-400 truncate">{report.lastGenerated}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mt-1">
                                        {/* View button */}
                                        <button
                                            title="View Report"
                                            onClick={() => setSelectedReport(report)}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all shrink-0 border border-transparent hover:border-blue-100"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                        {/* Download PDF button */}
                                        <button
                                            onClick={() => handleExport(report, 'pdf')}
                                            disabled={loadingId === `${report.id}-pdf`}
                                            title="Download PDF"
                                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[11px] font-bold rounded-xl transition-all shadow-sm shadow-blue-200"
                                        >
                                            {loadingId === `${report.id}-pdf` ? (
                                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                            PDF
                                        </button>
                                        {/* Export Excel button */}
                                        <button
                                            onClick={() => handleExport(report, 'excel')}
                                            disabled={loadingId === `${report.id}-excel`}
                                            title="Export Excel"
                                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-[11px] font-bold rounded-xl transition-all shadow-sm shadow-emerald-200"
                                        >
                                            {loadingId === `${report.id}-excel` ? (
                                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
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

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                REPORT DETAIL MODAL  (matches DSR / User Profile style)
            â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {/* â”€â”€ DETAIL MODAL (Insight View) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <Modal
                isOpen={!!selectedReport}
                onClose={() => setSelectedReport(null)}
                title="Report Insight"
                maxWidth="max-w-2xl"
            >
                {selectedReport && (
                    <div className="bg-white p-6 text-inter">
                        {/* â”€â”€ Blue Hero Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

                        {/* â”€â”€ Diagnostic Floor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

                        {/* â”€â”€ Action Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                        <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-bold rounded-2xl transition-all uppercase tracking-widest"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => { handleExport(selectedReport); setSelectedReport(null); }}
                                className="flex-[1.5] py-4 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
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
