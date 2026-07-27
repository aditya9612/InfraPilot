import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import {
    RotateCcw,
    FileDown
} from "lucide-react";

import { dsrService } from "../../services/dsrService";
import { workProgressService } from "../../services/workProgressService";
import { materialService } from "../../services/materialService";
import { issueService } from "../../services/issueService";
import { reportService } from "../../services/reportService";
import api from "../../services/api";
import { useProject } from "../../context/ProjectContext";

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
            { label: "Total Labour", value: "142 Labour", accent: "text-blue-600" },
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
        frequency: "Daily", // Changed to Daily so it shows in the filtered list
        metrics: [
            { label: "Open Issues", value: "3", accent: "text-rose-500" },
            { label: "Resolved Today", value: "2", accent: "text-emerald-600" },
            { label: "Weather Delay", value: "4 hrs", accent: "text-amber-600" },
            { label: "Manpower Gap", value: "6%", accent: "text-amber-600" },
        ],
    },
    {
        id: "monthly",
        name: "Monthly Executive Summary",
        description: "Comprehensive 30-day overview covering budget variance, schedule adherence, and major milestones achieved.",
        icon: "📊",
        badgeColor: "bg-purple-50 text-purple-600",
        accentBar: "bg-purple-500",
        lastGenerated: "1st of Month, 09:00 AM",
        size: "8.4 MB",
        frequency: "Monthly",
        metrics: [
            { label: "Budget Variance", value: "-2%", accent: "text-emerald-600" },
            { label: "Schedule Status", value: "On Track" },
            { label: "Milestones", value: "4 Completed" },
            { label: "Total Spend", value: "₹2.4 Cr", accent: "text-rose-500" },
        ],
    },
    {
        id: "quarterly",
        name: "Quarterly Progress",
        description: "High-level 90-day strategic review detailing contractor performance, total financial expenditure, and structural compliance.",
        icon: "🏢",
        badgeColor: "bg-cyan-50 text-cyan-600",
        accentBar: "bg-cyan-500",
        lastGenerated: "End of Quarter",
        size: "15.2 MB",
        frequency: "Quarterly",
        metrics: [
            { label: "Overall Compliance", value: "98%", accent: "text-emerald-600" },
            { label: "Contractor Rating", value: "4.5/5" },
            { label: "Safety Score", value: "A+" },
            { label: "Capital Deployed", value: "₹8.5 Cr" },
        ],
    },
];

// ─── Main Component ─────────────────────────────────────────────────────────────

const ReportsPage = () => {
    const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState("daily");
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Recent" | "Large" | "Issues">("All");
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [dynamicReports, setDynamicReports] = useState<ReportType[]>(reportTypes);
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const { selectedProjectId } = useProject();
    const projectId = selectedProjectId || 0;

    // ─── Export Filter State ───────────────────────────────────────────────────
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportFilters, setExportFilters] = useState({ start_date: "", end_date: "", contractor_name: "" });
    const [isExporting, setIsExporting] = useState(false);

    // ─── Labour Export Filter State ─────────────────────────────────────────────
    const [isLabourExportModalOpen, setIsLabourExportModalOpen] = useState(false);
    const [labourExportType, setLabourExportType] = useState<"pdf" | "excel">("pdf");
    const [labourExportFilters, setLabourExportFilters] = useState({ date: "", skill_category: "" });
    const [isLabourExporting, setIsLabourExporting] = useState(false);

    // ─── Issue Export Filter State ──────────────────────────────────────────────
    const [isIssueExportModalOpen, setIsIssueExportModalOpen] = useState(false);
    const [issueExportType, setIssueExportType] = useState<"pdf" | "excel">("pdf");
    const [issueExportFilters, setIssueExportFilters] = useState({ status: "", priority: "", start_date: "", end_date: "" });
    const [isIssueExporting, setIsIssueExporting] = useState(false);

    // ─── Quarterly Export Filter State ──────────────────────────────────────────
    const [isQuarterlyExportModalOpen, setIsQuarterlyExportModalOpen] = useState(false);
    const [quarterlyExportType, setQuarterlyExportType] = useState<"pdf" | "excel">("pdf");
    const [quarterlyExportFilters, setQuarterlyExportFilters] = useState({ report_date: "", start_date: "", end_date: "", month: "", year: "", quarter: "" });
    const [isQuarterlyExporting, setIsQuarterlyExporting] = useState(false);



    const fetchReports = useCallback(async () => {
        if (!projectId) return;
        setIsInitialLoading(true);
        try {
            const updatedReports = [...reportTypes];

            // 1. Daily Report Mapping (DSR)
            if (activeFilter === "daily") {
                try {
                    const dailyRes = await dsrService.getDsrByProject(projectId, { start_date: startDate, end_date: endDate });
                const dailyIdx = updatedReports.findIndex(r => r.id === "daily");
                if (dailyIdx !== -1) {
                    if (dailyRes && dailyRes.items && dailyRes.items.length > 0) {
                        // Get the most recent DSR
                        const latestDsr = dailyRes.items.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                        updatedReports[dailyIdx] = {
                            ...updatedReports[dailyIdx],
                            size: "1.2 MB",
                            lastGenerated: latestDsr.created_at ? `Generated: ${new Date(latestDsr.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Generated Today",
                            metrics: [
                                { label: "Total Labour", value: `${latestDsr.total_labour || 0} Labour`, accent: "text-blue-600" },
                                { label: "Skilled", value: latestDsr.skilled_labour?.toString() || "0" },
                                { label: "Weather", value: latestDsr.weather || "Clear" },
                                { label: "Location", value: latestDsr.site_location || "Site" },
                            ]
                        };
                    } else {
                        updatedReports[dailyIdx] = {
                            ...updatedReports[dailyIdx],
                            size: "—",
                            lastGenerated: "Not Generated",
                            metrics: [
                                { label: "Total Labour", value: "No Report", accent: "text-slate-400" },
                                { label: "Skilled", value: "—" },
                                { label: "Weather", value: "—" },
                                { label: "Location", value: "—" },
                            ]
                        };
                    }
                }
                } catch (err) {
                    console.warn("Failed to fetch DSR report metrics", err);
                }
            }

            // 2. Weekly Progress Mapping (Work Progress)
            if (activeFilter === "weekly") {
                try {
                    const summaryRes = await workProgressService.getProjectSummary(projectId);
                const weeklyIdx = updatedReports.findIndex(r => r.id === "weekly");
                if (weeklyIdx !== -1) {
                    if (summaryRes) {
                        const totalActivities = summaryRes.total_activities || 0;
                        const completedActivities = summaryRes.completed_activities || 0;
                        const delayedActivities = summaryRes.delayed_activities || 0;
                        const overallCompletion = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
                        
                        updatedReports[weeklyIdx] = {
                            ...updatedReports[weeklyIdx],
                            metrics: [
                                { label: "Overall Completion", value: `${overallCompletion}%`, accent: "text-emerald-600" },
                                { label: "Completed Activities", value: completedActivities.toString() },
                                { label: "Total Activities", value: totalActivities.toString() },
                                { label: "Delayed Activities", value: delayedActivities.toString(), accent: "text-rose-500" },
                            ]
                        };
                    } else {
                        updatedReports[weeklyIdx] = {
                            ...updatedReports[weeklyIdx],
                            metrics: [
                                { label: "Overall Completion", value: "0%", accent: "text-emerald-600" },
                                { label: "Completed Activities", value: "0" },
                                { label: "Total Activities", value: "0" },
                                { label: "Delayed Activities", value: "0", accent: "text-rose-500" },
                            ]
                        };
                    }
                }
                } catch (err) {
                    console.warn("Failed to fetch weekly report metrics", err);
                }
            }

            // 3. Labour Mapping — /api/v1/reports/labour
            if (activeFilter === "daily") {
                try {
                    const userStr = localStorage.getItem("infrapilot_user");
                    let token = "";
                if (userStr) {
                    try {
                        const user = JSON.parse(userStr);
                        token = user.token?.access_token || user.token || "";
                    } catch (e) {
                        console.error("Error parsing user token", e);
                    }
                }
                const headers: Record<string, string> = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;
                // Fetch using relative proxy url instead of hardcoded production
                const response = await fetch(`/api/v1/reports/labour?project_id=${projectId}`, { headers });
                const labourRes = await response.json();
                const laborIdx = updatedReports.findIndex(r => r.id === "labour");
                if (laborIdx !== -1) {
                    let parsedRes = labourRes;
                    if (typeof labourRes === 'string') {
                        try {
                            parsedRes = JSON.parse(labourRes);
                        } catch (e) {
                            console.error("Failed to parse labour report response", e);
                        }
                    }

                    const summary: Array<{ skill_type: string; count: number }> =
                        parsedRes?.labour_summary || parsedRes?.data?.labour_summary || [];

                    const skilled = summary.find(s => s.skill_type?.toLowerCase() === "skilled")?.count ?? 0;
                    const unskilled = summary.find(s => s.skill_type?.toLowerCase() === "unskilled")?.count ?? 0;
                    const total = summary.reduce((acc, s) => acc + (s.count ?? 0), 0);

                    updatedReports[laborIdx] = {
                        ...updatedReports[laborIdx],
                        metrics: [
                            { label: "Total Labour", value: total.toString(), accent: "text-blue-600" },
                            { label: "Skilled Labour", value: skilled.toString(), accent: "text-emerald-600" },
                            { label: "Unskilled Labour", value: unskilled.toString() },
                            { label: "Categories", value: summary.length.toString() },
                        ]
                    };
                }
            } catch (err) {
                console.warn("Failed to fetch labour report metrics", err);
            }
            }

            // 4. Material Mapping
            if (activeFilter === "daily") {
                try {
                    const materialRes = await materialService.listMaterials(projectId, { start_date: startDate, end_date: endDate } as any);
                    const materialIdx = updatedReports.findIndex(r => r.id === "material");
                    if (materialIdx !== -1) {
                        let totalStock = 0;
                        let totalValue = 0;
                        let numItems = 0;
                        if (materialRes && materialRes.length > 0) {
                            numItems = materialRes.length;
                            materialRes.forEach((m: any) => {
                                totalStock += Number(m.remaining_stock || 0);
                                totalValue += Number(m.total_amount || m.total_value || 0);
                            });
                        }

                        updatedReports[materialIdx] = {
                            ...updatedReports[materialIdx],
                            metrics: [
                                { label: "Total Stock Items", value: numItems.toString(), accent: "text-rose-500" },
                                { label: "Stock Qty", value: totalStock.toFixed(1) },
                                { label: "Stock Value", value: `₹${(totalValue / 1000).toFixed(1)}k` },
                                { label: "Status", value: numItems > 0 ? "Updated" : "No Data" },
                            ]
                        };
                    }
                } catch (err) {
                    console.warn("Failed to fetch material report metrics", err);
                }
            }

            // 5. Issues Mapping
            if (activeFilter === "daily") {
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
            }

            // 6. Monthly Executive Summary
            if (activeFilter === "monthly") {
                try {
                    const dateParts = startDate.split("-");
                    const currentMonth = Number(dateParts[1]);
                const currentYear = Number(dateParts[0]);

                const monthlyRes = await api.get(`/reports/project`, {
                    params: { project_id: projectId || 0, type: "monthly", month: currentMonth, year: currentYear }
                });
                
                const data = monthlyRes.data;
                const monthlyIdx = updatedReports.findIndex(r => r.id === "monthly");
                if (monthlyIdx !== -1 && data) {
                    updatedReports[monthlyIdx] = {
                        ...updatedReports[monthlyIdx],
                        lastGenerated: data.generated_at ? new Date(data.generated_at).toLocaleString() : "Recently",
                        metrics: [
                            { label: "Overall Progress", value: `${data.summary?.overall_progress || 0}%`, accent: "text-emerald-600" },
                            { label: "Completed Tasks", value: `${data.summary?.completed_tasks || 0}` },
                            { label: "Total Invoice", value: `₹${data.financials?.total_invoice?.toLocaleString() || 0}` },
                            { label: "Profit", value: `₹${data.financials?.profit?.toLocaleString() || 0}`, accent: "text-emerald-600" },
                        ]
                    };
                }
                } catch (err) {
                    console.warn("Failed to fetch monthly report metrics", err);
                }
            }

            // 7. Quarterly Performance Audit
            if (activeFilter === "quarterly") {
                try {
                    const dateParts = startDate.split("-");
                    const currentMonth = Number(dateParts[1]);
                const currentYear = Number(dateParts[0]);
                const currentQuarter = Math.ceil(currentMonth / 3);

                const quarterlyRes = await api.get(`/reports/quarterly-audit-summary`, {
                    params: { project_id: projectId || 0, year: currentYear, quarter: currentQuarter }
                });

                const data = quarterlyRes.data;
                const quarterlyIdx = updatedReports.findIndex(r => r.id === "quarterly");
                if (quarterlyIdx !== -1 && data) {
                    updatedReports[quarterlyIdx] = {
                        ...updatedReports[quarterlyIdx],
                        lastGenerated: `Q${data.quarter || currentQuarter} ${data.year || currentYear}`,
                        metrics: [
                            { label: "Total Expense", value: `₹${data.total_expense?.toLocaleString() || 0}`, accent: "text-rose-500" },
                            { label: "Total Invoice", value: `₹${data.total_invoice?.toLocaleString() || 0}`, accent: "text-emerald-600" },
                            { label: "Completed Tasks", value: `${data.completed_tasks || 0}` },
                            { label: "Delayed Tasks", value: `${data.delayed_tasks || 0}`, accent: "text-rose-500" },
                        ]
                    };
                }
                } catch (err) {
                    console.warn("Failed to fetch quarterly report metrics", err);
                }
            }

            setDynamicReports(updatedReports);
        } catch (error) {
            console.error("Failed to fetch reports", error);
            toast.error("Failed to sync site reports");
        } finally {
            setIsInitialLoading(false);
        }
    }, [projectId, startDate, endDate, activeFilter]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleExportCSV = async () => {
        const toastId = toast.loading("Generating Project Excel Report...");
        try {
            const dateParts = startDate.split("-");
            const year = dateParts[0];
            const month = dateParts[1];
            const type = activeFilter;
            
            const params = new URLSearchParams({
                project_id: String(projectId || 0),
                type: type,
                report_date: startDate,
                start_date: startDate,
                end_date: endDate,
                month: month,
                year: year
            });
            
            const response = await api.get(`/reports/project/export/excel?${params.toString()}`, {
                responseType: "blob",
                headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/octet-stream' }
            });

            if (response.data.type === "application/json") {
                const errorText = await response.data.text();
                throw new Error(errorText);
            }

            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Project_Report_${type}_${startDate}_to_${endDate}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Excel Report downloaded!", { id: toastId });
        } catch (error: any) {
            console.error("Failed to generate Excel", error);
            toast.error("Failed to generate Excel Report", { id: toastId });
        }
    };

    const handleExportPDF = async () => {
        const toastId = toast.loading("Generating Project PDF Report...");
        try {
            const dateParts = startDate.split("-");
            const year = dateParts[0];
            const month = dateParts[1];
            const type = activeFilter;
            
            const params = new URLSearchParams({
                project_id: String(projectId || 0),
                type: type,
                report_date: startDate,
                start_date: startDate,
                end_date: endDate,
                month: month,
                year: year
            });
            
            const response = await api.get(`/reports/project/export/pdf?${params.toString()}`, {
                responseType: "blob",
                headers: { 'Accept': 'application/pdf, application/octet-stream' }
            });

            if (response.data.type === "application/json") {
                const errorText = await response.data.text();
                throw new Error(errorText);
            }

            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Project_Report_${type}_${startDate}_to_${endDate}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("PDF Report downloaded!", { id: toastId });
        } catch (error: any) {
            console.error("Failed to generate PDF", error);
            toast.error("Failed to generate PDF Report", { id: toastId });
        }
    };

    const handleCardPDF = async (report: ReportType) => {
        setLoadingId(`pdf-${report.id}`);
        toast.loading(`Fetching data for ${report.name}...`, { id: `pdf-${report.id}` });
        try {
            if (report.id === "material") {
                const blob = await reportService.exportMaterialPDF(projectId || 0);
                
                if (blob.type === "application/json") {
                    const errorText = await blob.text();
                    console.error("PDF Generate Error:", errorText);
                    try {
                        const errObj = JSON.parse(errorText);
                        const msg = errObj.detail || errObj.message || errObj.error || "Could not generate PDF.";
                        toast.error(`Server error: ${msg}`, { id: `pdf-${report.id}` });
                    } catch (e) {
                        toast.error("Server error: Could not generate PDF.", { id: `pdf-${report.id}` });
                    }
                    return;
                }

                const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `Material_Consumption_Report_${new Date().toISOString().split("T")[0]}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toast.success(`${report.name} PDF downloaded!`, { id: `pdf-${report.id}` });
                return;
            }

            if (report.id === "daily") {
                if (report.lastGenerated === "Not Generated") {
                    toast.error("No daily report has been generated for this date.", { id: `pdf-${report.id}` });
                    return;
                }

                const response = await api.get(`/reports/daily/export/pdf?project_id=${projectId || 0}&report_date=${startDate}&_t=${Date.now()}`, {
                    responseType: "blob",
                    headers: { 'Accept': 'application/pdf, application/octet-stream' }
                });

                if (response.data.type === "application/json") {
                    const errorText = await response.data.text();
                    console.error("DSR PDF Generate Error:", errorText);
                    try {
                        const errObj = JSON.parse(errorText);
                        const msg = errObj.detail || errObj.message || errObj.error || "Could not generate DSR PDF.";
                        toast.error(`Server error: ${msg}`, { id: `pdf-${report.id}` });
                    } catch (e) {
                        toast.error("Server error: Could not generate DSR PDF.", { id: `pdf-${report.id}` });
                    }
                    return;
                }

                const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `Daily_Report_${startDate}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toast.success(`${report.name} PDF downloaded!`, { id: `pdf-${report.id}` });
                return;
            }

            if (report.id === "labour") {
                setLabourExportType("pdf");
                setIsLabourExportModalOpen(true);
                toast.dismiss(`pdf-${report.id}`);
                setLoadingId(null);
                return;
            }

            if (report.id === "weekly") {
                const blob = await reportService.exportWeeklyPDF(projectId || 0);
                
                if (blob.type === "application/json") {
                    const errorText = await blob.text();
                    console.error("PDF Generate Error:", errorText);
                    try {
                        const errObj = JSON.parse(errorText);
                        const msg = errObj.detail || errObj.message || errObj.error || "Could not generate PDF.";
                        toast.error(`Server error: ${msg}`, { id: `pdf-${report.id}` });
                    } catch (e) {
                        toast.error("Server error: Could not generate PDF.", { id: `pdf-${report.id}` });
                    }
                    return;
                }

                const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `Work_Progress_Report_${new Date().toISOString().split("T")[0]}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toast.success(`${report.name} PDF downloaded!`, { id: `pdf-${report.id}` });
                return;
            }

            if (report.id === "issue") {
                setIssueExportType("pdf");
                setIsIssueExportModalOpen(true);
                toast.dismiss(`pdf-${report.id}`);
                setLoadingId(null);
                return;
            }

            if (report.id === "quarterly") {
                setQuarterlyExportType("pdf");
                setIsQuarterlyExportModalOpen(true);
                toast.dismiss(`pdf-${report.id}`);
                setLoadingId(null);
                return;
            }

            const today = new Date();
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const year = today.getFullYear().toString();

            // Map our report.id to backend types: ["daily", "weekly", "monthly", "quarterly"]
            let mappedType = "monthly";
            if (report.id === "daily") mappedType = "daily";

            const reportData = await reportService.getProjectReportData(projectId || 0, mappedType, month, year);

            // Usually we'd pass this data to a PDF generator, but for now we fallback to our generic print
            console.log("Successfully fetched report data for PDF:", reportData);
            toast.dismiss(`pdf-${report.id}`);
            handleExportPDF();

        } catch (err: any) {
            console.error("Failed to fetch report data", err);
            if (err.response?.status === 404) {
                toast.error("No report data has been generated for this date.", { id: `pdf-${report.id}` });
            } else {
                toast.error("Failed to fetch report data", { id: `pdf-${report.id}` });
            }
        } finally {
            setLoadingId(null);
        }
    };

    const handleDSRExport = async () => {
        setIsExporting(true);
        const toastId = toast.loading("Generating Excel report...");
        try {
            const params: { start_date?: string; end_date?: string; contractor_name?: string } = {};
            if (exportFilters.start_date) params.start_date = exportFilters.start_date;
            if (exportFilters.end_date) params.end_date = exportFilters.end_date;
            if (exportFilters.contractor_name.trim()) params.contractor_name = exportFilters.contractor_name.trim();
            await dsrService.exportDsrExcel(projectId || 0, params);
            toast.success("Excel report exported!", { id: toastId });
            setIsExportModalOpen(false);
        } catch (err: any) {
            console.error("DSR Export failed:", err);
            if (err.response?.status === 404) {
                toast.error("No DSR records found for selected filters.", { id: toastId });
            } else {
                toast.error("Export failed", { id: toastId });
            }
        } finally {
            setIsExporting(false);
        }
    };

    const handleLabourExport = async () => {
        setIsLabourExporting(true);
        const toastId = toast.loading(`Generating Labour ${labourExportType === "pdf" ? "PDF" : "Excel"} report...`);
        try {
            const params: any = { project_id: projectId || 0 };
            if (labourExportFilters.date) params.date = labourExportFilters.date;
            if (labourExportFilters.skill_category) params.skill_category = labourExportFilters.skill_category;

            let blob;
            if (labourExportType === "pdf") {
                blob = await reportService.exportLabourPDF(params);
            } else {
                blob = await reportService.exportLabourExcel(params);
            }

            if (blob.type === "application/json") {
                const errorText = await blob.text();
                throw new Error(errorText);
            }

            const ext = labourExportType === "pdf" ? "pdf" : "xlsx";
            const mimeType = labourExportType === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            
            const url = window.URL.createObjectURL(new Blob([blob], { type: mimeType }));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Labour_Report_${new Date().toISOString().split("T")[0]}.${ext}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success(`Labour ${labourExportType === "pdf" ? "PDF" : "Excel"} downloaded!`, { id: toastId });
            setIsLabourExportModalOpen(false);
        } catch (error: any) {
            console.error(`Failed to generate Labour ${labourExportType}`, error);
            toast.error(`Failed to generate Labour ${labourExportType === "pdf" ? "PDF" : "Excel"}`, { id: toastId });
        } finally {
            setIsLabourExporting(false);
        }
    };

    const handleIssueExport = async () => {
        setIsIssueExporting(true);
        const toastId = toast.loading(`Generating Issue ${issueExportType === "pdf" ? "PDF" : "Excel"} report...`);
        try {
            const params: any = { project_id: projectId || 0 };
            if (issueExportFilters.status) params.status = issueExportFilters.status;
            if (issueExportFilters.priority) params.priority = issueExportFilters.priority;
            if (issueExportFilters.start_date) params.start_date = issueExportFilters.start_date;
            if (issueExportFilters.end_date) params.end_date = issueExportFilters.end_date;

            let blob;
            if (issueExportType === "pdf") {
                blob = await reportService.exportIssuePDF(params);
            } else {
                blob = await reportService.exportIssueExcel(params);
            }

            if (blob.type === "application/json") {
                const errorText = await blob.text();
                throw new Error(errorText);
            }

            const ext = issueExportType === "pdf" ? "pdf" : "xlsx";
            const mimeType = issueExportType === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            
            const url = window.URL.createObjectURL(new Blob([blob], { type: mimeType }));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `executive_site_issue_report.${ext}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success(`Issue ${issueExportType === "pdf" ? "PDF" : "Excel"} downloaded!`, { id: toastId });
            setIsIssueExportModalOpen(false);
        } catch (error: any) {
            console.error(`Failed to generate Issue ${issueExportType}`, error);
            toast.error(`Failed to generate Issue ${issueExportType === "pdf" ? "PDF" : "Excel"}`, { id: toastId });
        } finally {
            setIsIssueExporting(false);
        }
    };

            const handleQuarterlyExport = async () => {
        setIsQuarterlyExporting(true);
        const toastId = toast.loading(`Generating Quarterly ${quarterlyExportType === "pdf" ? "PDF" : "Excel"} report...`);
        try {
            const params: any = { project_id: projectId || 0, type: "quarterly" };
            if (quarterlyExportFilters.report_date) params.report_date = quarterlyExportFilters.report_date;
            if (quarterlyExportFilters.start_date) params.start_date = quarterlyExportFilters.start_date;
            if (quarterlyExportFilters.end_date) params.end_date = quarterlyExportFilters.end_date;
            if (quarterlyExportFilters.month) params.month = parseInt(quarterlyExportFilters.month);
            if (quarterlyExportFilters.year) params.year = parseInt(quarterlyExportFilters.year);
            if (quarterlyExportFilters.quarter) params.quarter = parseInt(quarterlyExportFilters.quarter);

            let blob;
            if (quarterlyExportType === "pdf") {
                blob = await reportService.exportProjectReportPDF(params);
            } else {
                blob = await reportService.exportProjectReportExcel(params);
            }

            if (blob.type === "application/json") {
                const errorText = await blob.text();
                throw new Error(errorText);
            }

            const ext = quarterlyExportType === "pdf" ? "pdf" : "xlsx";
            const mimeType = quarterlyExportType === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            
            const url = window.URL.createObjectURL(new Blob([blob], { type: mimeType }));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Quarterly_Report_${new Date().toISOString().split("T")[0]}.${ext}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success(`Quarterly ${quarterlyExportType === "pdf" ? "PDF" : "Excel"} downloaded!`, { id: toastId });
            setIsQuarterlyExportModalOpen(false);
        } catch (error: any) {
            console.error(`Failed to generate Quarterly ${quarterlyExportType}`, error);
            toast.error(`Failed to generate Quarterly ${quarterlyExportType === "pdf" ? "PDF" : "Excel"}`, { id: toastId });
        } finally {
            setIsQuarterlyExporting(false);
        }
    };

    const handleExport = async (report: ReportType) => {
        setLoadingId(report.id);
        toast.loading(`Exporting ${report.name}...`, { id: `exp-${report.id}` });
        try {
            if (report.id === "material") {
                const blob = await reportService.exportMaterialExcel(projectId || 0);

                if (blob.type === "application/json") {
                    const errorText = await blob.text();
                    console.error("Excel Generate Error:", errorText);
                    try {
                        const errObj = JSON.parse(errorText);
                        const msg = errObj.detail || errObj.message || errObj.error || "Could not generate Excel.";
                        toast.error(`Server error: ${msg}`, { id: `exp-${report.id}` });
                    } catch (e) {
                        toast.error("Server error: Could not generate Excel.", { id: `exp-${report.id}` });
                    }
                    return;
                }

                const url = window.URL.createObjectURL(new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `Material_Consumption_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toast.success(`${report.name} Excel downloaded!`, { id: `exp-${report.id}` });
                return;
            }

            if (report.id === "daily") {
                if (report.lastGenerated === "Not Generated") {
                    toast.error("No daily report has been generated for this date.", { id: `exp-${report.id}` });
                    setLoadingId(null);
                    return;
                }
                setIsExportModalOpen(true);
                toast.dismiss(`exp-${report.id}`);
                setLoadingId(null);
                return;
            }

            if (report.id === "issue") {
                setIssueExportType("excel");
                setIsIssueExportModalOpen(true);
                toast.dismiss(`exp-${report.id}`);
                setLoadingId(null);
                return;
            }

            if (report.id === "quarterly") {
                setQuarterlyExportType("excel");
                setIsQuarterlyExportModalOpen(true);
                toast.dismiss(`exp-${report.id}`);
                setLoadingId(null);
                return;
            }

            if (report.id === "monthly") {
                const dateParts = startDate.split("-");
                const currentMonth = Number(dateParts[1]);
                const currentYear = Number(dateParts[0]);

                const blob = await reportService.exportProjectReportExcel({
                    project_id: projectId || 0,
                    type: report.id,
                    month: currentMonth,
                    year: currentYear
                });

                if (blob.type === "application/json") {
                    toast.error(`Server error: Could not generate Excel.`, { id: `exp-${report.id}` });
                    return;
                }

                const url = window.URL.createObjectURL(new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `${report.name}_${currentYear}.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toast.success(`${report.name} Excel downloaded!`, { id: `exp-${report.id}` });
                return;
            }

            if (report.id === "labour") {
                setLabourExportType("excel");
                setIsLabourExportModalOpen(true);
                toast.dismiss(`exp-${report.id}`);
                setLoadingId(null);
                return;
            }

            if (report.id === "weekly") {
                const blob = await reportService.exportWeeklyExcel(projectId || 0);

                if (blob.type === "application/json") {
                    const errorText = await blob.text();
                    console.error("Excel Generate Error:", errorText);
                    try {
                        const errObj = JSON.parse(errorText);
                        const msg = errObj.detail || errObj.message || errObj.error || "Could not generate Excel.";
                        toast.error(`Server error: ${msg}`, { id: `exp-${report.id}` });
                    } catch (e) {
                        toast.error("Server error: Could not generate Excel.", { id: `exp-${report.id}` });
                    }
                    return;
                }

                const url = window.URL.createObjectURL(new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `Work_Progress_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toast.success(`${report.name} Excel downloaded!`, { id: `exp-${report.id}` });
                return;
            }

            const today = new Date();
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const year = today.getFullYear().toString();

            let mappedType = "monthly";
            if (report.id === "daily") mappedType = "daily";

            const reportData = await reportService.getProjectReportData(projectId || 0, mappedType, month, year);

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
        } catch (e: any) {
            console.error("Export failed", e);
            if (e.response?.status === 404) {
                toast.error("No report data has been generated for this date.", { id: `exp-${report.id}` });
            } else {
                toast.error("Export failed", { id: `exp-${report.id}` });
            }
        } finally {
            setLoadingId(null);
        }
    };

    const filtered = useMemo(() => {
        let data = dynamicReports.filter(r => r.frequency.toLowerCase() === activeFilter.toLowerCase());

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

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Reports
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Generate, view, and export daily, weekly, labour, material, and issue reports.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={fetchReports}
                            disabled={isInitialLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50"
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
                </div>

                {/* ── Interactive Stats ────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        {
                            title: "Total Reports",
                            value: reportsStats.total.toString(),
                            sub: "Available in Catalog",
                            accent: "text-primary",
                            status: "All",
                        },
                        {
                            title: "Generated Today",
                            value: reportsStats.generatedToday.toString(),
                            sub: "Recent Site Logs",
                            accent: "text-emerald-500",
                            status: "Recent",
                        },
                        {
                            title: "Avg. Report Size",
                            value: `${reportsStats.avgSize} MB`,
                            sub: "Inventory Volume",
                            accent: "text-amber-500",
                            status: "Large",
                        },
                        {
                            title: "Open Issues",
                            value: reportsStats.openIssues.toString(),
                            sub: "High Priority Items",
                            accent: "text-rose-500",
                            status: "Issues",
                        },
                    ].map((s) => (
                        <div
                            key={s.title}
                            onClick={() => s.status && setActiveStatFilter(s.status as any)}
                            className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all ${s.status ? 'hover:shadow-md cursor-pointer active:scale-95 hover:border-primary/20' : 'cursor-default'} group`}
                        >
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-primary transition-colors">
                                {s.title}
                            </p>
                            <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                            {s.sub && (
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                                    {s.sub}
                                </p>
                            )}
                        </div>
                    ))}
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

                    {/* Date Pickers */}
                    <div className="flex gap-4 min-w-[250px]">
                        <div className="flex flex-col gap-0.5 w-1/2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none transition-all cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-0.5 w-1/2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none transition-all cursor-pointer"
                                />
                            </div>
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
                                <option value="daily">daily</option>
                                <option value="weekly">weekly</option>
                                <option value="monthly">monthly</option>
                                <option value="quarterly">quarterly</option>
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
                <div className="flex-1 overflow-auto custom-scrollbar pr-2">

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
            {/* ── Export Filter Modal ─────────────────────────────────────────── */}
            {isExportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Export Daily to Excel</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Apply filters before downloading (all fields optional)</p>
                            </div>
                            <button
                                onClick={() => setIsExportModalOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Start Date */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Start Date</label>
                                <input
                                    type="date"
                                    value={exportFilters.start_date}
                                    onChange={e => setExportFilters(f => ({ ...f, start_date: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                                />
                            </div>
                            {/* End Date */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">End Date</label>
                                <input
                                    type="date"
                                    value={exportFilters.end_date}
                                    onChange={e => setExportFilters(f => ({ ...f, end_date: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                                />
                            </div>
                            {/* Contractor Name */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Contractor Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Shree Construction"
                                    value={exportFilters.contractor_name}
                                    onChange={e => setExportFilters(f => ({ ...f, contractor_name: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setExportFilters({ start_date: "", end_date: "", contractor_name: "" });
                                }}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                Clear Filters
                            </button>
                            <button
                                onClick={handleDSRExport}
                                disabled={isExporting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
                            >
                                <FileDown className="w-4 h-4" />
                                {isExporting ? "Exporting..." : "Download Excel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* ── Labour Export Filter Modal ────────────────────────────────────── */}
            {isLabourExportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    Export Labour Report to {labourExportType === "pdf" ? "PDF" : "Excel"}
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">Apply filters before downloading (all fields optional)</p>
                            </div>
                            <button
                                onClick={() => setIsLabourExportModalOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Date */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
                                <input
                                    type="date"
                                    value={labourExportFilters.date}
                                    onChange={e => setLabourExportFilters(f => ({ ...f, date: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                                />
                            </div>
                            {/* Skill Category */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Skill Category</label>
                                <select
                                    value={labourExportFilters.skill_category}
                                    onChange={e => setLabourExportFilters(f => ({ ...f, skill_category: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all appearance-none"
                                >
                                    <option value="">All Categories</option>
                                    <option value="SKILLED">Skilled</option>
                                    <option value="UNSKILLED">Unskilled</option>
                                    <option value="SEMI_SKILLED">Semi Skilled</option>
                                    <option value="SUPERVISOR">Supervisor</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setLabourExportFilters({ date: "", skill_category: "" });
                                }}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                Clear Filters
                            </button>
                            <button
                                onClick={handleLabourExport}
                                disabled={isLabourExporting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                            >
                                <FileDown className="w-4 h-4" />
                                {isLabourExporting ? "Exporting..." : `Download ${labourExportType === "pdf" ? "PDF" : "Excel"}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Issue Export Filter Modal ─────────────────────────────────────── */}
            {isIssueExportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    Export Issue Report to {issueExportType === "pdf" ? "PDF" : "Excel"}
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">Apply filters before downloading (all fields optional)</p>
                            </div>
                            <button
                                onClick={() => setIsIssueExportModalOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Status */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                                <select
                                    value={issueExportFilters.status}
                                    onChange={e => setIssueExportFilters(f => ({ ...f, status: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all appearance-none"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>
                            {/* Priority */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Priority</label>
                                <select
                                    value={issueExportFilters.priority}
                                    onChange={e => setIssueExportFilters(f => ({ ...f, priority: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all appearance-none"
                                >
                                    <option value="">All Priorities</option>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>
                            {/* Start Date */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Reported Start Date</label>
                                <input
                                    type="date"
                                    value={issueExportFilters.start_date}
                                    onChange={e => setIssueExportFilters(f => ({ ...f, start_date: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                                />
                            </div>
                            {/* End Date */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Reported End Date</label>
                                <input
                                    type="date"
                                    value={issueExportFilters.end_date}
                                    onChange={e => setIssueExportFilters(f => ({ ...f, end_date: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setIssueExportFilters({ status: "", priority: "", start_date: "", end_date: "" });
                                }}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                Clear Filters
                            </button>
                            <button
                                onClick={handleIssueExport}
                                disabled={isIssueExporting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                            >
                                <FileDown className="w-4 h-4" />
                                {isIssueExporting ? "Exporting..." : `Download ${issueExportType === "pdf" ? "PDF" : "Excel"}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Quarterly Export Filter Modal ─────────────────────────────────── */}
            {isQuarterlyExportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto pt-20 pb-20">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    Export Quarterly Progress to {quarterlyExportType === "pdf" ? "PDF" : "Excel"}
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">Apply filters before downloading (all fields optional)</p>
                            </div>
                            <button
                                onClick={() => setIsQuarterlyExportModalOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Report Date */}
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Report Date</label>
                                <input
                                    type="date"
                                    value={quarterlyExportFilters.report_date}
                                    onChange={e => setQuarterlyExportFilters(f => ({ ...f, report_date: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                                />
                            </div>
                            {/* Empty space or filler */}
                            <div className="hidden sm:block"></div>
                            
                            {/* Start Date */}
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Start Date</label>
                                <input
                                    type="date"
                                    value={quarterlyExportFilters.start_date}
                                    onChange={e => setQuarterlyExportFilters(f => ({ ...f, start_date: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                                />
                            </div>
                            {/* End Date */}
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">End Date</label>
                                <input
                                    type="date"
                                    value={quarterlyExportFilters.end_date}
                                    onChange={e => setQuarterlyExportFilters(f => ({ ...f, end_date: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                                />
                            </div>

                            {/* Month */}
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Month (1-12)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    placeholder="e.g. 7"
                                    value={quarterlyExportFilters.month}
                                    onChange={e => setQuarterlyExportFilters(f => ({ ...f, month: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                                />
                            </div>
                            {/* Year */}
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Year</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 2026"
                                    value={quarterlyExportFilters.year}
                                    onChange={e => setQuarterlyExportFilters(f => ({ ...f, year: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                                />
                            </div>
                            
                            {/* Quarter */}
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Quarter (1-4)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="4"
                                    placeholder="e.g. 2"
                                    value={quarterlyExportFilters.quarter}
                                    onChange={e => setQuarterlyExportFilters(f => ({ ...f, quarter: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setQuarterlyExportFilters({ report_date: "", start_date: "", end_date: "", month: "", year: "", quarter: "" });
                                }}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                Clear Filters
                            </button>
                            <button
                                onClick={handleQuarterlyExport}
                                disabled={isQuarterlyExporting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                            >
                                <FileDown className="w-4 h-4" />
                                {isQuarterlyExporting ? "Exporting..." : `Download ${quarterlyExportType === "pdf" ? "PDF" : "Excel"}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ReportsPage;
