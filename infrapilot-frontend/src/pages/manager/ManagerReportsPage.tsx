import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { reportService } from "../../services/reportService";
import { boqService } from "../../services/boqService";
import { workProgressService } from "../../services/workProgressService";
import { useProject } from "../../context/ProjectContext";
import ReportPreviewModal from "../../components/dashboard/ReportPreviewModal";
import ShareReportModal from "../../components/dashboard/ShareReportModal";
import ReportDateModal from "../../components/dashboard/ReportDateModal";
import ReportPeriodModal from "../../components/dashboard/ReportPeriodModal";
import type { ReportPeriodSelection } from "../../components/dashboard/ReportPeriodModal";
import toast from "react-hot-toast";
import {
    FileText,
    BarChart3,
    PieChart,
    TrendingUp,
    Download,
    Share2,
    Search,
    Building2,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    ChevronDown,
    DollarSign,
    Users
} from "lucide-react";
import { formatCompactCurrency } from "../../utils/currencyUtils";

type ReportCategory = "Operations" | "Resources" | "Financials";

interface ReportType {
    id: string;
    name: string;
    category: ReportCategory;
    description: string;
    icon: React.ReactNode;
    exportType: "PDF" | "Excel" | "Both";
    requiresDate?: boolean;
    requiresRange?: boolean;
}

const REPORT_TYPES: ReportType[] = [
    // Operations
    { id: "daily", name: "Daily Progress Report", category: "Operations", description: "Detailed site activities, weather conditions, and work completed per shift.", icon: <FileText size={20} className="text-blue-500" />, exportType: "PDF", requiresDate: true },
    { id: "weekly", name: "Project Report", category: "Operations", description: "Weekly, monthly, or quarterly project progress and performance report.", icon: <BarChart3 size={20} className="text-indigo-500" />, exportType: "Both" },
    { id: "issues", name: "Issue Analysis", category: "Operations", description: "Analysis of open site issues, delay causes, and resolution trends.", icon: <AlertCircle size={20} className="text-rose-500" />, exportType: "Both" },

    // Resources
    { id: "labour", name: "Workforce Analytics", category: "Resources", description: "Labour deployment trends, skill-mix distribution, and attendance.", icon: <Users size={20} className="text-amber-500" />, exportType: "Both" },
    { id: "material", name: "Material Lifecycle", category: "Resources", description: "Tracking material inflows, consumption rates, and wastage analysis.", icon: <Building2 size={20} className="text-cyan-500" />, exportType: "Both" },
    { id: "equipment", name: "Equipment Reports", category: "Resources", description: "Full equipment utilization, maintenance status, and deployment analytics.", icon: <Building2 size={20} className="text-orange-500" />, exportType: "Both" },
    { id: "assets", name: "Asset Reports", category: "Resources", description: "Fixed assets tracking, depreciation analysis, and asset utilization overview.", icon: <FileText size={20} className="text-violet-500" />, exportType: "Both" },

    // Financials
    { id: "cost-comparison", name: "Budget vs Actual", category: "Financials", description: "Real-time comparison of estimated costs vs actual expenditure.", icon: <DollarSign size={20} className="text-emerald-600" />, exportType: "Both" },
    { id: "financial-summary", name: "Project Financial Health", category: "Financials", description: "Overview of billing status, expenses, and pending payments.", icon: <TrendingUp size={20} className="text-blue-600" />, exportType: "Both" },
    { id: "procurement", name: "Procurement Efficiency", category: "Financials", description: "Purchase order status and vendor payment reconciliation.", icon: <Building2 size={20} className="text-purple-500" />, exportType: "Both" },
    { id: "profit-loss", name: "Profit & Loss", category: "Financials", description: "Comprehensive income, expenses, and net profit/loss breakdown for the project.", icon: <PieChart size={20} className="text-rose-500" />, exportType: "Both" },
];

const ManagerReportsPage = () => {
    const { selectedProjectId, assignedProjects, setSelectedProjectId } = useProject();
    const [activeCategory, setActiveCategory] = useState<ReportCategory>("Operations");
    const [searchQuery, setSearchQuery] = useState("");

    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // Preview / Share modals
    const [viewingReport, setViewingReport] = useState<{ id: string, name: string, data: any, exportType: "PDF" | "Excel" | "Both" } | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [reportToShare, setReportToShare] = useState<{ id: string, name: string } | null>(null);

    // Date selection modal
    const [isDateSelectionOpen, setIsDateSelectionOpen] = useState(false);
    const [dateModalConfig, setDateModalConfig] = useState<{
        id: string;
        name: string;
        format: "PDF" | "Excel";
        isRange: boolean;
        action?: "export" | "view";
    } | null>(null);

    // Period selection modal (for weekly report)
    const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
    const [periodModalConfig, setPeriodModalConfig] = useState<{
        format: "PDF" | "Excel";
    } | null>(null);

    const [stats, setStats] = useState({
        totalExpense: 0,
        totalProfit: 0,
        completion: 0,
        activeIssues: 0
    });

    useEffect(() => {
        const fetchGlobalStats = async () => {
            if (!selectedProjectId) return;
            try {
                const [finSummary, progressSummary, issueRes] = await Promise.all([
                    reportService.getFinancialSummary(selectedProjectId).catch(() => null),
                    workProgressService.getProjectSummary(selectedProjectId).catch(() => null),
                    reportService.getIssueReport(selectedProjectId).catch(() => null)
                ]);

                const profit = (finSummary?.total_billing || 0) - (finSummary?.total_expense || 0);

                const total = progressSummary?.total_activities || 0;
                const completed = progressSummary?.completed_activities || 0;
                const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

                setStats({
                    totalExpense: finSummary?.total_expense || 0,
                    totalProfit: profit,
                    completion: completionRate,
                    activeIssues: (issueRes as any)?.open_issues || 0
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
        };
        fetchGlobalStats();
    }, [selectedProjectId]);

    const handleExport = async (reportId: string, format: "PDF" | "Excel", customStart?: string, customEnd?: string) => {
        if (!selectedProjectId) {
            toast.error("Please select a project first");
            return;
        }

        const toastId = toast.loading(`Generating ${format} report...`);
        try {
            const effectiveStart = customStart || startDate;
            const effectiveEnd = customEnd || endDate;

            // Date Requirement Guard
            const reportType = REPORT_TYPES.find(r => r.id === reportId);
            if (!dateModalConfig && (reportType?.requiresDate || reportType?.requiresRange)) {
                toast.dismiss(toastId);
                setDateModalConfig({
                    id: reportId,
                    name: reportType.name,
                    format: format,
                    isRange: !!reportType.requiresRange,
                    action: "export"
                });
                setIsDateSelectionOpen(true);
                return;
            }

            let blob: Blob | null = null;
            const pid = selectedProjectId;

            switch (reportId) {
                case "daily":
                    blob = format === "PDF"
                        ? await reportService.exportProjectReportPDF({ project_id: pid, type: "daily", report_date: effectiveEnd })
                        : await reportService.exportProjectReportExcel({ project_id: pid, type: "daily", report_date: effectiveEnd });
                    break;
                case "weekly":
                    // Open period selection modal first
                    toast.dismiss(toastId);
                    setPeriodModalConfig({ format });
                    setIsPeriodModalOpen(true);
                    return;
                case "cost-comparison":
                    blob = format === "PDF"
                        ? await reportService.exportFinancePdf(pid)
                        : await reportService.exportFinanceExcel(pid);
                    break;
                case "labour":
                    blob = format === "PDF"
                        ? await reportService.exportLabourDistributionPdf(pid)
                        : await reportService.exportLabourDistributionExcel(pid);
                    break;
                case "material":
                    blob = format === "PDF"
                        ? await reportService.exportMaterialPDF(pid)
                        : await reportService.exportMaterialExcel(pid);
                    break;
                case "project-report":
                    blob = format === "PDF"
                        ? await reportService.exportProjectReportPDF({ project_id: pid, type: "monthly" })
                        : await reportService.exportProjectReportExcel({ project_id: pid, type: "monthly" });
                    break;
                case "profit-loss":
                    blob = format === "PDF"
                        ? await reportService.exportProfitLossPdf(pid)
                        : await reportService.exportProfitLossExcel(pid);
                    break;
                case "equipment":
                    blob = format === "PDF"
                        ? await reportService.exportEquipmentPdf()
                        : await reportService.exportEquipmentExcel();
                    break;
                case "issues":
                    blob = format === "PDF"
                        ? await reportService.exportIssuePDF({ project_id: pid })
                        : await reportService.exportIssueExcel({ project_id: pid });
                    break;
                case "assets":
                    blob = format === "PDF"
                        ? await reportService.exportAssetsPdf(pid)
                        : await reportService.exportAssetsExcel(pid);
                    break;
                default:
                    blob = await reportService.downloadCombinedReport(pid, effectiveStart, effectiveEnd);
            }

            if (blob && !blob.type.includes('json')) {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                const extension = format.toLowerCase() === 'pdf' ? 'pdf' : 'xlsx';
                link.setAttribute('download', `${reportId}_${effectiveEnd}.${extension}`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toast.success("Report exported successfully", { id: toastId });
            } else {
                throw new Error("Invalid report response");
            }
        } catch (error) {
            toast.error("Export failed", { id: toastId });
        }
    };

    const generateCSV = (data: any[], filename: string) => {
        if (!data || data.length === 0) return;
        const headers = Object.keys(data[0]).join(",");
        const rows = data.map(row =>
            Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
        ).join("\n");
        const blob = new Blob([headers + "\n" + rows], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const handleViewSummary = async (report: ReportType, selectedDate?: string) => {
        if (!selectedProjectId) {
            toast.error("Please select a project first");
            return;
        }

        const toastId = toast.loading(`Fetching ${report.name} summary...`);
        try {
            const pid = selectedProjectId;
            let data: any;

            if ((report.requiresDate || report.requiresRange) && !selectedDate) {
                toast.dismiss(toastId);
                setDateModalConfig({
                    id: report.id,
                    name: report.name,
                    format: "PDF",
                    isRange: false,
                    action: "view"
                });
                setIsDateSelectionOpen(true);
                return;
            }

            const today = selectedDate || new Date().toISOString().split('T')[0];

            switch (report.id) {
                case "daily": data = await reportService.getDailyReport(pid, today); break;
                case "cost-comparison": data = await boqService.getBoqComparison(pid); break;
                case "financial-summary": data = await reportService.getFinancialSummary(pid); break;
                case "project-report": data = await reportService.getProjectReport(pid); break;
                case "labour": data = await reportService.getLabourReport(pid); break;
                case "material": data = await reportService.getMaterialReport(pid); break;
                case "profit-loss": data = await reportService.getProfitLoss(); break;
                default: data = { message: "Advanced summary metrics are being calculated." };
            }

            setViewingReport({ name: report.name, data, id: report.id, exportType: report.exportType });
            setIsPreviewOpen(true);
            toast.success("Summary loaded", { id: toastId });
        } catch (error) {
            toast.error("Failed to load summary", { id: toastId });
        }
    };

    // Handle period modal confirmation
    const handlePeriodConfirm = async (selection: ReportPeriodSelection) => {
        if (!selectedProjectId || !periodModalConfig) return;
        const { format } = periodModalConfig;
        const toastId = toast.loading(`Generating ${format} report...`);
        try {
            const pid = selectedProjectId;
            let blob: Blob | null = null;
            const params = {
                project_id: pid,
                type: selection.type,
                month: selection.month ?? null,
                year: selection.year ?? null,
                quarter: selection.quarter ?? null,
                report_date: selection.start_date ?? null,
                start_date: selection.start_date ?? null,
                end_date: selection.end_date ?? null,
            };
            blob = format === "PDF"
                ? await reportService.exportProjectReportPDF(params)
                : await reportService.exportProjectReportExcel(params);

            if (blob && !blob.type.includes("json")) {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.setAttribute("download", `weekly_report_${selection.type}_${selection.year}.${format === "PDF" ? "pdf" : "xlsx"}`);
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                toast.success("Report exported successfully", { id: toastId });
            } else {
                throw new Error("Invalid response");
            }
        } catch {
            toast.error("Export failed", { id: toastId });
        }
    };

    const filteredReports = REPORT_TYPES.filter(r =>
        r.category === activeCategory &&
        (r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <>
            <Navbar title="Intelligence & Reports" breadcrumb={["Manager", "Reports"]} />

            <PageTransition className="p-6 lg:p-10 bg-[#F8FAFC] min-h-screen">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Project Analytics</h1>
                        <p className="text-slate-500 font-medium mt-1">
                            Consolidated intelligence for infrastructure lifecycle management.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group w-full lg:w-72">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                            <select
                                value={selectedProjectId || ""}
                                onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                                className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-700 appearance-none cursor-pointer shadow-sm"
                            >
                                <option value="">Select Project</option>
                                {assignedProjects.map(p => (
                                    <option key={p.id} value={p.id}>{p.project_name}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronDown size={18} />
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                if (!selectedProjectId) return toast.error("Select a project first");
                                setReportToShare({ id: "combined", name: "Consolidated Project Report" });
                                setIsShareModalOpen(true);
                            }}
                            className="px-6 py-3 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/25 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Share2 size={18} />
                            Share Report
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: "Net Margin", value: formatCompactCurrency(stats.totalProfit), sub: "Billing vs Costs", icon: <TrendingUp size={22} />, color: "bg-emerald-50 text-emerald-600" },
                        { label: "Operational Spend", value: formatCompactCurrency(stats.totalExpense), sub: "Total Expenditure", icon: <DollarSign size={22} />, color: "bg-rose-50 text-rose-500" },
                        { label: "Execution Rank", value: `${stats.completion}%`, sub: "Progress Compliance", icon: <CheckCircle2 size={22} />, color: "bg-blue-50 text-blue-600" },
                        { label: "Active Blockers", value: stats.activeIssues.toString(), sub: "Site Issues", icon: <AlertCircle size={22} />, color: "bg-amber-50 text-amber-600" },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color}`}>
                                    {stat.icon}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-2xl font-black text-slate-800 tracking-tight">{stat.value}</p>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-200 w-2/3 rounded-full" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{stat.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Categories & Search */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                    <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 w-fit">
                        {(["Operations", "Resources", "Financials"] as ReportCategory[]).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeCategory === cat ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="relative group w-full lg:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search reports, metrics, or departments..."
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Report Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredReports.map(report => (
                        <div key={report.id} className="group bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col justify-between border-b-4 border-b-transparent hover:border-b-primary">
                            <div>
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                        {report.icon}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                        {report.exportType !== "Excel" && (
                                            <button
                                                onClick={() => handleExport(report.id, "PDF")}
                                                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary hover:text-white flex items-center justify-center transition-all shadow-sm"
                                            >
                                                <Download size={18} />
                                            </button>
                                        )}
                                        {report.exportType !== "PDF" && (
                                            <button
                                                onClick={() => handleExport(report.id, "Excel")}
                                                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                                            >
                                                <FileText size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <h4 className="text-xl font-black text-slate-800 mb-3 group-hover:text-primary transition-colors">{report.name}</h4>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                    {report.description}
                                </p>
                            </div>

                            <div className="mt-10 pt-6 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Data</span>
                                </div>
                                <button
                                    onClick={() => handleViewSummary(report)}
                                    className="flex items-center gap-2 text-primary font-black text-sm group-hover:gap-3 transition-all"
                                >
                                    Explore Details
                                    <ArrowRight size={16} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredReports.length === 0 && (
                        <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white rounded-[3.5rem] border border-slate-100 shadow-inner overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent pointer-events-none" />
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-6 border border-slate-100 shadow-sm">
                                <Search size={36} />
                            </div>
                            <h3 className="text-lg font-black text-slate-700">No matching reports found</h3>
                            <p className="text-slate-400 font-bold text-sm mt-1 max-w-xs text-center">Try refining your search terms or checking a different category.</p>
                        </div>
                    )}
                </div>
            </PageTransition>

            <ReportPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                reportName={viewingReport?.name || ""}
                data={viewingReport?.data}
                reportId={viewingReport?.id}
                exportType={viewingReport?.exportType || "Excel"}
                onExport={(format: "PDF" | "Excel") => viewingReport && handleExport(viewingReport.id, format)}
                onShare={() => {
                    if (viewingReport) {
                        setReportToShare({ id: viewingReport.id, name: viewingReport.name });
                        setIsShareModalOpen(true);
                    }
                }}
            />

            <ShareReportModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                reportName={reportToShare?.name || ""}
                onShare={async (type, target) => {
                    if (!selectedProjectId) return;
                    const toastId = toast.loading(`Sharing via ${type}...`);
                    try {
                        const data = {
                            project_id: selectedProjectId,
                            target,
                            start_date: startDate,
                            end_date: endDate
                        };
                        if (type === 'email') await reportService.shareCombinedEmail(data);
                        else await reportService.shareCombinedWhatsapp(data);
                        toast.success("Shared successfully!", { id: toastId });
                    } catch (error) {
                        toast.error("Share failed", { id: toastId });
                    }
                }}
            />

            <ReportDateModal
                isOpen={isDateSelectionOpen}
                onClose={() => {
                    setIsDateSelectionOpen(false);
                    setDateModalConfig(null);
                }}
                reportName={dateModalConfig?.name || ""}
                format={dateModalConfig?.format || "PDF"}
                isRange={dateModalConfig?.isRange}
                onConfirm={async (start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                    setIsDateSelectionOpen(false);
                    if (dateModalConfig?.action === "view") {
                        const report = REPORT_TYPES.find(r => r.id === dateModalConfig.id);
                        if (report) handleViewSummary(report, end);
                    } else if (dateModalConfig) {
                        handleExport(dateModalConfig.id, dateModalConfig.format, start, end);
                    }
                }}
            />

            <ReportPeriodModal
                isOpen={isPeriodModalOpen}
                onClose={() => { setIsPeriodModalOpen(false); setPeriodModalConfig(null); }}
                reportName="Project Report"
                format={periodModalConfig?.format || "PDF"}
                onConfirm={handlePeriodConfirm}
            />
        </>
    );
};

export default ManagerReportsPage;
