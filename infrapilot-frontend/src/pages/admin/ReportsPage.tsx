import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { reportService } from "../../services/reportService";
import { projectService } from "../../services/projectService";
import { documentService } from "../../services/documentService";
import ReportPreviewModal from "../../components/dashboard/ReportPreviewModal";
import ShareReportModal from "../../components/dashboard/ShareReportModal";
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
  ChevronDown
} from "lucide-react";

type ReportCategory = "Operations" | "Resources" | "Financials" | "Performance";

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
  { id: "daily", name: "Daily Progress Report", category: "Operations", description: "Comprehensive summary of daily site activities, issues, and planned work.", icon: <FileText size={18} />, exportType: "PDF", requiresDate: true },
  { id: "weekly", name: "Weekly Progress Summary", category: "Operations", description: "Aggregated progress percentage and task completion metrics for the week.", icon: <BarChart3 size={18} />, exportType: "PDF" },
  { id: "work-summary", name: "Work Category Summary", category: "Operations", description: "Efficiency analysis and status breakdown by work category.", icon: <TrendingUp size={18} />, exportType: "Both" },
  { id: "issues", name: "Site Issues Report", category: "Operations", description: "Critical analysis of open vs closed site issues and bottlenecks.", icon: <AlertCircle size={18} />, exportType: "Excel" },

  { id: "labour", name: "Labour Distribution", category: "Resources", description: "Statistical breakdown of skilled and unskilled manpower allocation.", icon: <PieChart size={18} />, exportType: "Excel" },
  { id: "material", name: "Material Consumption", category: "Resources", description: "Tracking purchased vs used materials and remaining stock levels.", icon: <Building2 size={18} />, exportType: "Excel" },
  { id: "assets", name: "Fixed Assets Report", category: "Financials", description: "Valuation and depreciation tracking of project machinery and equipment.", icon: <Building2 size={18} />, exportType: "Excel" },

  { id: "financial-summary", name: "Financial Health Summary", category: "Financials", description: "Overview of revenue, expenses, and pending invoices.", icon: <TrendingUp size={18} />, exportType: "PDF" },
  { id: "profit-loss", name: "Profit & Loss Statement", category: "Financials", description: "Global financial performance analysis across the organization.", icon: <BarChart3 size={18} />, exportType: "PDF" },
  { id: "cashflow", name: "Cash Inflow/Outflow", category: "Financials", description: "Monitoring liquidity and currency movement within the system.", icon: <TrendingUp size={18} />, exportType: "PDF" },
  { id: "quarterly-audit", name: "Quarterly Audit Summary", category: "Financials", description: "Regulatory compliance and internal audit trail for the quarter.", icon: <FileText size={18} />, exportType: "PDF", requiresRange: true },

  { id: "contractor-performance", name: "Contractor Efficiency", category: "Performance", description: "Evaluating contractor progress against payments and task timelines.", icon: <PieChart size={18} />, exportType: "Both" },
  { id: "project-report", name: "Consolidated Project Report", category: "Performance", description: "A high-level project health report including revenue and profit.", icon: <FileText size={18} />, exportType: "PDF" },
];

const ReportsPage = () => {
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState<ReportCategory>("Operations");
  const [subFilter, setSubFilter] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Sync category and specific report with URL
  useEffect(() => {
    const path = location.pathname;
    setSubFilter(null); // Reset sub-filter by default

    if (path.includes('/financial')) {
      setActiveCategory("Financials");
    } else if (path.includes('/labour')) {
      setActiveCategory("Resources");
      setSubFilter("labour");
    } else if (path.includes('/consumption')) {
      setActiveCategory("Resources");
      setSubFilter("material");
    } else if (path.includes('/performance')) {
      setActiveCategory("Performance");
    } else {
      setActiveCategory("Operations");
    }
  }, [location.pathname]);
  const [searchQuery, setSearchQuery] = useState("");

  // Preview modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<{ id: string, name: string, data: any } | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [reportToShare, setReportToShare] = useState<{ id: string, name: string } | null>(null);

  const [stats, setStats] = useState({
    totalExpense: 0,
    totalProfit: 0,
    generatedReports: 0,
    avgEfficiency: 0
  });


  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [projList, financialSummary, docStats] = await Promise.all([
          projectService.getProjects(100),
          reportService.getProfitLoss().catch(() => null),
          documentService.getStats().catch(() => null)
        ]);

        const pList = Array.isArray(projList) ? projList : projList.items || [];
        setProjects(pList);
        if (pList.length > 0) setSelectedProjectId(pList[0].id.toString());

        // Calculate avg efficiency from projects using completion_percentage
        const totalProgress = pList.reduce((acc: number, curr: any) => acc + (curr.completion_percentage || 0), 0);
        const avgEff = pList.length > 0 ? (totalProgress / pList.length).toFixed(1) : 0;

        setStats(prev => ({
          ...prev,
          totalExpense: financialSummary?.total_expense || 0,
          totalProfit: (financialSummary?.total_invoice || financialSummary?.total_revenue || 0) - (financialSummary?.total_expense || 0),
          generatedReports: docStats?.total_documents || 0,
          avgEfficiency: Number(avgEff)
        }));
      } catch (error) {
        console.error("Failed to fetch initial reporting data", error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const updateStatsForProject = async () => {
      if (!selectedProjectId || selectedProjectId === "all") return;

      try {
        const pid = parseInt(selectedProjectId);
        const [projectProfitLoss, projectSummary] = await Promise.all([
          projectService.getProjectProfitLoss(pid).catch(() => null),
          reportService.getFinancialSummary(pid).catch(() => null)
        ]);

        if (projectProfitLoss || projectSummary) {
          setStats(prev => ({
            ...prev,
            totalExpense: projectProfitLoss?.total_expense || projectSummary?.total_expense || prev.totalExpense,
            totalProfit: (projectProfitLoss?.total_invoice || projectSummary?.total_billing || 0) - (projectProfitLoss?.total_expense || projectSummary?.total_expense || 0),
          }));
        }
      } catch (error) {
        console.error("Failed to update stats for project", error);
      }
    };

    updateStatsForProject();
  }, [selectedProjectId]);

  const handleExport = async (reportId: string, format: "PDF" | "Excel") => {
    const toastId = toast.loading(`Generating ${format} report...`);
    try {
      let blob: Blob;
      const pid = parseInt(selectedProjectId);
      const today = new Date().toISOString().split('T')[0];

      switch (reportId) {
        case "daily":
          blob = await reportService.exportDailyPDF(pid, today);
          break;
        case "labour":
          blob = await reportService.exportLabourExcel(pid);
          break;
        case "material":
          blob = await reportService.exportMaterialExcel(pid);
          break;
        case "issues":
          blob = await reportService.exportIssueExcel(pid);
          break;
        case "audit-pdf":
        case "quarterly-audit":
          blob = await reportService.exportAuditPDF(pid);
          break;
        default:
          // Fallback generic combined report for others
          blob = await reportService.downloadCombinedReport(pid, "2026-01-01", today);
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportId}_report_${today}.${format.toLowerCase() === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Report exported successfully", { id: toastId });
    } catch (error) {
      toast.error("Failed to export report", { id: toastId });
    }
  };

  const handleShareCombined = async (type: "email" | "whatsapp", target: string) => {
    const toastId = toast.loading(`Sharing combined report via ${type}...`);
    try {
      const pid = parseInt(selectedProjectId);
      if (isNaN(pid)) throw new Error("Please select a project first");

      const today = new Date().toISOString().split('T')[0];
      const data = {
        project_id: pid,
        target: target,
        start_date: "2026-01-01",
        end_date: today
      };

      if (type === "email") {
        await reportService.shareCombinedEmail(data);
      } else {
        await reportService.shareCombinedWhatsapp(data);
      }

      toast.success("Combined report shared successfully!", { id: toastId });
    } catch (error: any) {
      toast.error(error.message || "Failed to share combined report", { id: toastId });
      throw error;
    }
  };
  const handleViewSummary = async (report: ReportType) => {
    const toastId = toast.loading(`Fetching ${report.name} data...`);
    try {
      let data: any;
      const pid = parseInt(selectedProjectId);
      const today = new Date().toISOString().split('T')[0];

      switch (report.id) {
        case "daily": data = await reportService.getDailyReport(pid, today); break;
        case "weekly": data = await reportService.getWeeklyProgress(pid); break;
        case "labour": data = await reportService.getLabourReport(pid); break;
        case "material": data = await reportService.getMaterialReport(pid); break;
        case "issues": data = await reportService.getIssueReport(pid); break;
        case "work-summary": data = await reportService.getWorkSummary(pid); break;
        case "contractor-performance": data = await reportService.getContractorPerformance(pid); break;
        case "profit-loss": data = await reportService.getProfitLoss(); break;
        case "project-report": data = await reportService.getProjectReport(pid); break;
        case "cashflow": data = await reportService.getCashflow(); break;
        case "assets": data = await reportService.getAssetReport(); break;
        case "financial-summary": data = await reportService.getFinancialSummary(pid); break;
        case "quarterly-audit": data = await reportService.getQuarterlyAudit(pid, 2026, 2); break;
        default: data = { message: "Detailed summary view coming soon for this report type." };
      }

      setViewingReport({ name: report.name, data, id: report.id });
      setIsPreviewOpen(true);
      toast.success("Summary loaded", { id: toastId });
    } catch (error) {
      toast.error("Failed to load report summary", { id: toastId });
    }
  };

  const filteredReports = REPORT_TYPES.filter(r =>
    r.category === activeCategory &&
    (subFilter ? r.id === subFilter : true) &&
    (r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <Navbar title="Reports & Analytics" breadcrumb={["Admin", "Reports"]} />

      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Business Intelligence</h1>
            <p className="text-slate-500 text-sm mt-1">
              Real-time infrastructure projects and data-driven site audit trails.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (!selectedProjectId || selectedProjectId === "all") {
                  toast.error("Please select a specific project to share combined intelligence.");
                  return;
                }
                setReportToShare({ id: "combined", name: "Combined Project Intelligence" });
                setIsShareModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all active:scale-95"
            >
              <Share2 size={18} strokeWidth={2.5} />
              Share Combined
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue Focus</span>
            </div>
            <h3 className="text-2xl font-black text-slate-800">₹{(stats.totalProfit / 100000).toFixed(2)}L</h3>
            <p className="text-[11px] font-bold text-emerald-500 mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} /> Net project profit
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expenditure</span>
            </div>
            <h3 className="text-2xl font-black text-slate-800">₹{(stats.totalExpense / 100000).toFixed(2)}L</h3>
            <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> Combined site costs
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                <FileText size={20} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity Log</span>
            </div>
            <h3 className="text-2xl font-black text-slate-800">{stats.generatedReports}</h3>
            <p className="text-[11px] font-bold text-blue-500 mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} /> Documented reports
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <BarChart3 size={20} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</span>
            </div>
            <h3 className="text-2xl font-black text-slate-800">{stats.avgEfficiency}%</h3>
            <p className="text-[11px] font-bold text-emerald-500 mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> Syncing from {projects.length} sites
            </p>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
          <div className="relative group w-full md:w-72">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-700 appearance-none cursor-pointer"
            >
              <option value="">Select a project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.project_name || p.name}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ChevronDown size={18} />
            </div>
          </div>

          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search specifically within these reports..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-semibold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Report Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredReports.map(report => (
                <div key={report.id} className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
                        {report.icon}
                      </div>
                      <div className="flex gap-2">
                        {report.exportType !== "Excel" && (
                          <button
                            onClick={() => handleExport(report.id, "PDF")}
                            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all"
                            title="Export PDF"
                          >
                            <Download size={18} />
                          </button>
                        )}
                        {report.exportType !== "PDF" && (
                          <button
                            onClick={() => handleExport(report.id, "Excel")}
                            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 flex items-center justify-center transition-all"
                            title="Export Excel"
                          >
                            <FileText size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                    <h4 className="text-lg font-black text-slate-800 mb-2">{report.name}</h4>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
                      {report.description}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Real-time Data Ready</span>
                    </div>
                    <button
                      onClick={() => handleViewSummary(report)}
                      className="flex items-center gap-2 text-primary font-black text-sm group-hover:gap-3 transition-all"
                    >
                      View Summary
                      <ArrowRight size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}

              {filteredReports.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                    <Search size={32} />
                  </div>
                  <p className="text-slate-500 font-bold">No reports matching your search</p>
                  <p className="text-slate-400 text-sm mt-1">Try broad terms like "Progress" or "Financial"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageTransition>

      <ReportPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        reportName={viewingReport?.name || ""}
        data={viewingReport?.data}
        onExport={(format: "PDF" | "Excel") => viewingReport && handleExport(viewingReport.id, format)}
      />

      <ShareReportModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        reportName={reportToShare?.name || ""}
        onShare={handleShareCombined}
      />
    </>
  );
};

export default ReportsPage;
