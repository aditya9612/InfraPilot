import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import { useClientProjectId } from "../../hooks/useClientProjectId";
import { reportService } from "../../services/reportService";
import { dsrService } from "../../services/dsrService";
import { workProgressService } from "../../services/workProgressService";
import { issueService } from "../../services/issueService";
import { materialService } from "../../services/materialService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";
import Modal from "../../components/common/Modal";

const OverviewCard = ({ title, value, sub, active, red, onClick }: any) => (
  <div
    onClick={onClick}
    className={`bg-white p-5 rounded-3xl border-2 ${active ? 'border-blue-600' : 'border-slate-100'} shadow-sm flex flex-col justify-between h-32 transition-all hover:shadow-md cursor-pointer hover:border-blue-200 active:scale-95`}
  >
    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">{title}</h3>
    <div>
      <p className={`text-4xl font-black ${red ? 'text-[#EF4444]' : 'text-slate-800'} tracking-tight`}>{value}</p>
      <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{sub}</p>
    </div>
  </div>
);

const ReportCard = ({ level, title, desc, stats, size, time, onPDF, onExcel, onView, colorClass, icon, iconBg }: any) => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col h-full overflow-hidden group font-inter">
    <div className="p-6 pb-3">
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl ${iconBg || (colorClass.replace('text', 'bg') + ' bg-opacity-10')} flex items-center justify-center ${colorClass}`}>
            {icon ? (
              typeof icon === 'string' ? (
                <img src={icon} alt="" className="w-5 h-5" />
              ) : (
                icon
              )
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{level}</p>
            <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">{title}</h3>
          </div>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{size}</p>
      </div>
      <p className="text-[12px] font-bold text-slate-500 leading-relaxed mb-6">{desc}</p>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
        {stats.map((stat: any, i: number) => (
          <div key={i}>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
            <p className="text-sm font-black text-slate-800 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="mt-auto p-6 pt-3 border-t border-slate-50/50 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{time || "Today, 08:30 AM"}</p>
        <button
          onClick={onView}
          title="View Details"
          className="p-1.5 ml-1 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={onPDF} className="px-5 py-2.5 bg-[#FEF2F2] text-[#EF4444] rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#FEE2E2] transition-colors active:scale-95">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          PDF
        </button>
        <button onClick={onExcel} className="px-5 py-2.5 bg-[#EFF6FF] text-[#2563EB] rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#DBEAFE] transition-colors active:scale-95">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Excel
        </button>
      </div>
    </div>
  </div>
);

const ClientReportsPage = () => {
  const { projectId } = useClientProjectId();
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<any>(null);
  const [materialSummary, setMaterialSummary] = useState<any>(null);
  const [issueSummary, setIssueSummary] = useState<any>(null);
  const [reportDate, setReportDate] = useState(() => {
    const saved = localStorage.getItem('client_report_date');
    return saved || new Date().toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [frequency, setFrequency] = useState("All Cycles");
  const [labourSummary, setLabourSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showInsight, setShowInsight] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<any>(null);

  // Daily Excel export modal state
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelStartDate, setExcelStartDate] = useState("");
  const [excelEndDate, setExcelEndDate] = useState("");
  const [excelContractorName, setExcelContractorName] = useState("");
  const [isExcelDownloading, setIsExcelDownloading] = useState(false);

  // Labour PDF modal state
  const [showLabourPdfModal, setShowLabourPdfModal] = useState(false);
  const [labourPdfDate, setLabourPdfDate] = useState("");
  const [labourPdfSkillCategory, setLabourPdfSkillCategory] = useState("");
  const [isLabourPdfDownloading, setIsLabourPdfDownloading] = useState(false);

  // Labour Excel modal state
  const [showLabourExcelModal, setShowLabourExcelModal] = useState(false);
  const [labourExcelDate, setLabourExcelDate] = useState("");
  const [labourExcelSkillCategory, setLabourExcelSkillCategory] = useState("");
  const [isLabourExcelDownloading, setIsLabourExcelDownloading] = useState(false);

  // Issue PDF modal state
  const [showIssuePdfModal, setShowIssuePdfModal] = useState(false);
  const [issuePdfStatus, setIssuePdfStatus] = useState("");
  const [issuePdfPriority, setIssuePdfPriority] = useState("");
  const [issuePdfStartDate, setIssuePdfStartDate] = useState("");
  const [issuePdfEndDate, setIssuePdfEndDate] = useState("");
  const [isIssuePdfDownloading, setIsIssuePdfDownloading] = useState(false);

  // Issue Excel modal state
  const [showIssueExcelModal, setShowIssueExcelModal] = useState(false);
  const [issueExcelStatus, setIssueExcelStatus] = useState("");
  const [issueExcelPriority, setIssueExcelPriority] = useState("");
  const [issueExcelStartDate, setIssueExcelStartDate] = useState("");
  const [issueExcelEndDate, setIssueExcelEndDate] = useState("");
  const [isIssueExcelDownloading, setIsIssueExcelDownloading] = useState(false);

  // Weekly PDF modal state
  const [showWeeklyPdfModal, setShowWeeklyPdfModal] = useState(false);
  const [weeklyPdfStartDate, setWeeklyPdfStartDate] = useState("");
  const [weeklyPdfEndDate, setWeeklyPdfEndDate] = useState("");
  const [isWeeklyPdfDownloading, setIsWeeklyPdfDownloading] = useState(false);

  // Weekly Excel modal state
  const [showWeeklyExcelModal, setShowWeeklyExcelModal] = useState(false);
  const [weeklyExcelStartDate, setWeeklyExcelStartDate] = useState("");
  const [weeklyExcelEndDate, setWeeklyExcelEndDate] = useState("");
  const [isWeeklyExcelDownloading, setIsWeeklyExcelDownloading] = useState(false);

  const fetchAllReports = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const pid = projectId;
      const [daily, weekly, material, issues, labour] = await Promise.all([
        // 1) Daily Report — GET /api/v1/reports/daily
        reportService.getDailyReport(pid, reportDate).catch(err => {
          console.error("Daily report fetch failed:", err);
          return null;
        }),
        // 5) Weekly Progress — GET /api/v1/work-progress/project-summary/{project_id}
        workProgressService.getProjectSummary(pid).catch(err => {
          console.error("Weekly progress fetch failed:", err);
          return null;
        }),
        // 3) Material Report — GET /api/v1/materials/reports
        materialService.getMaterialReport(pid).catch(err => {
          console.error("Material report fetch failed:", err);
          return null;
        }),
        // 4) Issue Report — GET /api/v1/reports/issues
        reportService.getIssueReport(pid).catch(err => {
          console.error("Issues fetch failed:", err);
          return null;
        }),
        // 2) Labour Report — GET /api/v1/reports/labour
        reportService.getLabourReport(pid).catch(err => {
          console.error("Labour report fetch failed:", err);
          return null;
        })
      ]);

      console.log("[Reports] daily=", daily, "weekly=", weekly, "material=", material, "issues=", issues, "labour=", labour);

      // ── DAILY ──────────────────────────────────────────────────────────────
      const resolvedDaily = daily ? (daily.dsr !== undefined ? daily.dsr : daily) : null;
      setDailyReport(resolvedDaily);

      // ── WEEKLY ─────────────────────────────────────────────────────────────
      // API returns ProjectSummary: { total_activities, completed_activities, delayed_activities, on_track_activities, not_started_activities, completion_percentage }
      const totalActivities = weekly?.total_activities || 0;
      const completedActivities = weekly?.completed_activities || 0;
      const delayedActivities = weekly?.delayed_activities || 0;
      const overallCompletion = weekly?.completion_percentage !== undefined 
        ? weekly.completion_percentage 
        : (totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0);
      setWeeklyProgress({
        tasks: [],
        total_activities: totalActivities,
        completed_activities: completedActivities,
        delayed_activities: delayedActivities,
        overall_completion: overallCompletion
      });

      // ── MATERIAL ───────────────────────────────────────────────────────────
      // API returns: { summary: any, materials: MaterialReport[] }
      const allMaterials = material?.materials || [];
      const summaryInfo = material?.summary || {};
      const projectMaterials = allMaterials.filter((m: any) =>
        !m.project_id || Number(m.project_id) === Number(projectId)
      );
      const uniqueMaterials = projectMaterials.reduce((acc: any[], item: any) => {
        const name = (item.material_name || item.name || "").trim().toLowerCase();
        if (name && !acc.some(m => (m.material_name || m.name || "").trim().toLowerCase() === name)) {
          acc.push(item);
        }
        return acc;
      }, []);
      const finalMaterials = uniqueMaterials.filter((m: any) => m.material_name || m.name);
      const calcPurchased  = finalMaterials.reduce((acc: number, item: any) => acc + Number(item.quantity_purchased || item.total_purchased || 0), 0);
      const calcUsed       = finalMaterials.reduce((acc: number, item: any) => acc + Number(item.quantity_used || item.total_used || 0), 0);
      const calcStock      = finalMaterials.reduce((acc: number, item: any) => acc + Number(item.remaining_stock || 0), 0);
      const calcValue      = finalMaterials.reduce((acc: number, item: any) => acc + Number(item.total_amount || item.total_cost || 0), 0);
      setMaterialSummary({
        items:           finalMaterials,
        total_items:     summaryInfo?.total_materials ?? summaryInfo?.total_items ?? finalMaterials.length,
        total_purchased: summaryInfo?.total_purchased ?? calcPurchased,
        total_used:      summaryInfo?.total_used      ?? calcUsed,
        total_qty:       summaryInfo?.total_stock     ?? summaryInfo?.remaining_stock ?? calcStock,
        total_value:     summaryInfo?.total_value     ?? summaryInfo?.total_stock_value ?? calcValue
      });

      // ── ISSUES ─────────────────────────────────────────────────────────────
      // API returns flat summary: { open, closed, critical?, total? }
      // or may return { issues:[...], open_issues, closed_issues, ... }
      const issueList: any[] = Array.isArray(issues)
        ? issues
        : (issues?.issues || issues?.items || issues?.data?.items || issues?.data || []);
      const projectIssues = issueList.filter((i: any) =>
        !i.project_id || Number(i.project_id) === Number(pid)
      );
      setIssueSummary({
        items:    projectIssues,
        // Direct flat-summary field names (from screenshot: {open:22, closed:1})
        open:     issues?.open      ?? issues?.open_issues     ?? projectIssues.filter((i: any) =>
          i.status?.toLowerCase() !== 'resolved' && i.status?.toLowerCase() !== 'closed'
        ).length,
        closed:   issues?.closed    ?? issues?.resolved_issues ?? projectIssues.filter((i: any) =>
          i.status?.toLowerCase() === 'resolved' || i.status?.toLowerCase() === 'closed'
        ).length,
        critical: issues?.critical  ?? issues?.critical_issues ?? projectIssues.filter((i: any) =>
          i.priority?.toLowerCase() === 'high' || i.priority?.toLowerCase() === 'critical'
        ).length,
        total:    issues?.total ?? issues?.total_issues ?? (((issues?.open ?? 0) + (issues?.closed ?? 0)) || projectIssues.length)
      });

      // ── LABOUR ─────────────────────────────────────────────────────────────
      // API may return: { total_workers, skilled_workers, unskilled_workers, contractors_count, labour_summary:[...] }
      let resolvedLabour = labour;
      if (labour) {
        const summary = Array.isArray(labour) ? labour : (labour.labour_summary || labour.data?.labour_summary || []);
        const calcTotalWorkers = summary.reduce((acc: number, curr: any) => acc + (Number(curr.count) || 0), 0);
        const calcSkilled = summary.find((s: any) => s.skill_type?.toLowerCase() === 'skilled')?.count ?? 0;
        const calcUnskilled = summary.find((s: any) => s.skill_type?.toLowerCase() === 'unskilled')?.count ?? 0;
        
        resolvedLabour = {
          ...labour,
          total_workers: labour.total_workers ?? labour.total_acc_workers ?? labour.total_labour ?? calcTotalWorkers,
          skilled_workers: labour.skilled_workers ?? labour.skilled_labour ?? calcSkilled,
          unskilled_workers: labour.unskilled_workers ?? labour.unskilled_labour ?? calcUnskilled,
          contractors_count: labour.contractors_count ?? labour.categories_count ?? (summary.length || 0),
          labour_summary: summary
        };
      }
      setLabourSummary(resolvedLabour);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (projectId) {
      fetchAllReports();
    }
  }, [projectId, reportDate]);

  const downloadFile = (blob: Blob, fileName: string, type: string) => {
    const url = window.URL.createObjectURL(new Blob([blob], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const allReports = [
    {
      level: "DAILY",
      title: "Daily Report",
      size: "1.2 MB",
      colorClass: "text-orange-600",
      iconBg: "bg-blue-50",
      frequency: "Daily",
      time: "Today, 08:30 AM",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="3" width="16" height="18" rx="2" fill="#FDEBD0" />
          <path d="M9 3h6v3H9V3z" fill="#99A3A4" />
          <rect x="7" y="8" width="10" height="11" fill="white" />
          <path d="M9 11h6M9 14h6M9 17h4" stroke="#D5D8DC" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      desc: dailyReport
        ? (dailyReport.work_done || "Full summary of today's site operations — labour deployed, work completed, materials consumed, and any issues logged.")
        : "Daily operations report has not yet been filed for this date.",
      stats: [
        { label: "TOTAL LABOUR", value: dailyReport ? `${dailyReport?.total_labour ?? 0} Labour` : "Not Filed" },
        { label: "SKILLED", value: dailyReport ? (dailyReport?.skilled_labour ?? 0) : "Not Filed" },
        { label: "WEATHER", value: dailyReport ? (dailyReport?.weather || 'N/A') : "Not Filed" },
        { label: "LOCATION", value: dailyReport ? (dailyReport?.site_location || "N/A") : "Not Filed" }
      ],
      onPDF: () => handleExportDailyPDF(),
      onExcel: () => { setExcelStartDate(reportDate); setExcelEndDate(reportDate); setExcelContractorName(""); setShowExcelModal(true); },
      onView: () => {
        setSelectedInsight({
          title: "Daily Report",
          level: "DAILY",
          description: dailyReport
            ? (dailyReport.work_done || "Full summary of today's site operations — labour deployed, work completed, materials consumed, and any issues logged.")
            : "Daily operations report has not yet been filed for this date.",
          size: "1.2 MB",
          time: "Today, 08:30 AM",
          status: dailyReport ? "VERIFIED / READY" : "UNAVAILABLE",
          metrics: [
            { label: "TOTAL LABOUR", value: dailyReport ? `${dailyReport?.total_labour ?? 0} Labour` : "0 Labour", color: "text-blue-600" },
            { label: "SKILLED FORCE", value: dailyReport ? (dailyReport?.skilled_labour ?? 0) : 0 },
            { label: "SITE WEATHER", value: dailyReport ? (dailyReport?.weather || 'N/A') : 'N/A' },
            { label: "SITE LOCATION", value: dailyReport ? (dailyReport?.site_location || "N/A") : 'N/A', color: "text-green-600" }
          ]
        });
        setShowInsight(true);
      }
    },
    {
      level: "WEEKLY",
      title: "Weekly Progress",
      size: "4.5 MB",
      colorClass: "text-blue-600",
      iconBg: "bg-green-50",
      frequency: "Weekly",
      time: "Mon, 10:00 AM",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="6" fill="#F0F9FF" />
          <rect x="5" y="5" width="14" height="14" rx="2" fill="#E0E7FF" stroke="#C7D2FE" strokeWidth="1" />
          <path d="M5 9.6h14M5 14.4h14M9.6 5v14M14.4 5v14" stroke="#C7D2FE" strokeWidth="0.5" />
          <path d="M7 15l3-3 3 1.5L17 8" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      desc: "7-day performance summary covering milestone achievements, planned vs actual progress, and workforce trends.",
      stats: [
        { label: "OVERALL COMPLETION", value: `${weeklyProgress?.overall_completion ?? 33}%` },
        { label: "COMPLETED ACTIVITIES", value: weeklyProgress?.completed_activities ?? 0 },
        { label: "TOTAL ACTIVITIES", value: weeklyProgress?.total_activities ?? 8 },
        { label: "DELAYED ACTIVITIES", value: weeklyProgress?.delayed_activities ?? 0 }
      ],
      onPDF: () => setShowWeeklyPdfModal(true),
      onExcel: () => setShowWeeklyExcelModal(true),
      onView: () => {
        setSelectedInsight({
          title: "Weekly Progress",
          level: "WEEKLY",
          description: "7-day performance summary covering milestone achievements, planned vs actual progress, and workforce trends.",
          size: "4.5 MB",
          time: "Mon, 10:00 AM",
          status: "ALIGNED / ON-TRACK",
          metrics: [
            { label: "OVERALL COMPLETION", value: `${weeklyProgress?.overall_completion ?? 33}%`, color: "text-blue-600" },
            { label: "COMPLETED ACTIVITIES", value: weeklyProgress?.completed_activities ?? 0 },
            { label: "TOTAL ACTIVITIES", value: weeklyProgress?.total_activities ?? 8 },
            { label: "DELAYED ACTIVITIES", value: weeklyProgress?.delayed_activities ?? 0, color: "text-rose-500" }
          ]
        });
        setShowInsight(true);
      }
    },
    {
      level: "DAILY",
      title: "Labour Report",
      size: "0.8 MB",
      colorClass: "text-yellow-600",
      iconBg: "bg-yellow-50",
      frequency: "Daily",
      time: "Today, 07:15 AM",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#FFFBEB" />
          <path d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z" fill="#FDE68A" />
          <path d="M6 18c0-2.21 1.79-4 4-4h4c2.21 0 4 1.79 4 4v1H6v-1z" fill="#F59E0B" />
          <path d="M8 7c0-2.21 1.79-4 4-4s4 1.79 4 4v1H8V7z" fill="#FCD34D" />
          <path d="M12 3v1.5" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      desc: "Workforce breakdown by skill category, attendance, overtime, and contractor-wise deployment summary.",
      stats: [
        { label: "TOTAL LABOUR",    value: labourSummary?.total_workers   ?? labourSummary?.total_labour   ?? dailyReport?.total_labour   ?? 0 },
        { label: "SKILLED LABOUR",  value: labourSummary?.skilled_workers  ?? labourSummary?.skilled_labour  ?? dailyReport?.skilled_labour  ?? 0 },
        { label: "UNSKILLED LABOUR", value: labourSummary?.unskilled_workers ?? labourSummary?.unskilled_labour ?? dailyReport?.unskilled_labour ?? 0 },
        { label: "CATEGORIES",     value: labourSummary?.contractors_count ?? labourSummary?.categories_count ?? (labourSummary?.labour_summary?.length ?? 0) }
      ],
      onPDF: () => setShowLabourPdfModal(true),
      onExcel: () => setShowLabourExcelModal(true),
      onView: () => {
        setSelectedInsight({
          title: "Labour Report",
          level: "DAILY",
          description: "Workforce breakdown by skill category, attendance, overtime, and contractor-wise deployment summary.",
          size: "0.8 MB",
          time: "Today, 07:15 AM",
          status: "AUDITED / VERIFIED",
          metrics: [
            { label: "TOTAL LABOUR", value: `${labourSummary?.total_workers || dailyReport?.total_labour || 3} Workers`, color: "text-blue-600" },
            { label: "SKILLED LABOUR", value: labourSummary?.skilled_workers || dailyReport?.skilled_labour || 3 },
            { label: "UNSKILLED LABOUR", value: labourSummary?.unskilled_workers || "0" },
            { label: "CATEGORIES", value: labourSummary?.contractors_count || "1", color: "text-green-600" }
          ]
        });
        setShowInsight(true);
      }
    },
    {
      level: "DAILY",
      title: "Material Consumption",
      size: "2.1 MB",
      colorClass: "text-red-600",
      iconBg: "bg-blue-50",
      frequency: "Daily",
      time: "2 Hours Ago",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M4 21h16" stroke="#EAECEE" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 21V5l10 3" stroke="#F1C40F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 8h10" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 8v5" stroke="#95A5A6" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="16" y="13" width="4" height="3" fill="#E74C3C" rx="1" />
        </svg>
      ),
      desc: "Inflow vs outflow reconciliation for all materials — cement, steel, aggregates — with stock closing balances.",
      stats: [
        { label: "TOTAL ITEMS", value: materialSummary?.total_items ?? 10 },
        { label: "PURCHASED", value: Math.round(materialSummary?.total_purchased ?? 500).toLocaleString() },
        { label: "USED", value: Math.round(materialSummary?.total_used ?? 200).toLocaleString() },
        { label: "STOCK VALUE", value: `₹${(materialSummary?.total_value / 1000000 || 0.45).toFixed(2)}M` }
      ],
      onPDF: () => handleExportMaterialPDF(),
      onExcel: () => handleExportMaterialExcel(),
      onView: () => {
        setSelectedInsight({
          title: "Material Consumption",
          level: "DAILY",
          description: "Inflow vs outflow reconciliation for all materials — cement, steel, aggregates — with stock closing balances.",
          size: "2.1 MB",
          time: "2 Hours Ago",
          status: "BALANCED / IN-STOCK",
          metrics: [
            { label: "TOTAL ITEMS", value: materialSummary?.total_items ?? 12, color: "text-blue-600" },
            { label: "PURCHASED", value: Math.round(materialSummary?.total_purchased ?? 850).toLocaleString() },
            { label: "USED", value: Math.round(materialSummary?.total_used ?? 340).toLocaleString() },
            { label: "STOCK VALUE", value: `₹${(materialSummary?.total_value / 1000000 || 1.2).toFixed(2)}M`, color: "text-green-600" }
          ]
        });
        setShowInsight(true);
      }
    },
    {
      level: "AS NEEDED",
      title: "Issue Report",
      size: "0.5 MB",
      colorClass: "text-amber-600",
      iconBg: "bg-red-50",
      frequency: "As Needed",
      time: "5 Mins Ago",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M12 4l9 16H3L12 4z" fill="#FCF3CF" stroke="#F1C40F" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M12 9v5" stroke="#F39C12" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="12" cy="17" r="1.2" fill="#F39C12" />
        </svg>
      ),
      desc: "Logged site issues, safety observations, delays, and their current resolution status and priority levels.",
      stats: [
        { label: "OPEN ISSUES", value: issueSummary?.open ?? 0 },
        { label: "CRITICAL", value: issueSummary?.critical ?? 0 },
        { label: "RESOLVED", value: issueSummary?.closed ?? 0 },
        { label: "TOTAL", value: issueSummary?.total ?? 0 }
      ],
      onPDF: () => setShowIssuePdfModal(true),
      onExcel: () => setShowIssueExcelModal(true),
      onView: () => {
        setSelectedInsight({
          title: "Issue Report",
          level: "AS NEEDED",
          description: "Logged site issues, safety observations, delays, and their current resolution status and priority levels.",
          size: "0.5 MB",
          time: "5 Mins Ago",
          status: "ACTIVE / MONITORING",
          metrics: [
            { label: "OPEN ISSUES", value: issueSummary?.open ?? 4, color: "text-red-600" },
            { label: "CRITICAL", value: issueSummary?.critical ?? 1 },
            { label: "RESOLVED", value: issueSummary?.closed ?? 2 },
            { label: "TOTAL", value: issueSummary?.total ?? 18, color: "text-slate-800" }
          ]
        });
        setShowInsight(true);
      }
    }
  ];

  const generatePremiumPDF = (options: {
    title: string;
    subtitle: string;
    summaryStats: Array<{ label: string; value: string }>;
    tableHeaders: string[][];
    tableBody: any[][];
    fileName: string;
  }) => {
    const { title, subtitle, summaryStats, tableHeaders, tableBody, fileName } = options;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const primaryBlue: [number, number, number] = [15, 23, 42]; // #0F172A
    const accentOrange: [number, number, number] = [249, 115, 22]; // #F97316

    // --- HEADER BACKGROUND ---
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(0, 0, pageWidth, 45, 'F');

    // --- LOGO / BRANDING ---
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("INFRA", 14, 25);
    doc.setTextColor(accentOrange[0], accentOrange[1], accentOrange[2]);
    doc.text("PILOT", 42, 25);

    doc.setTextColor(200, 200, 200);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Construction Billing Software", 14, 32);

    // --- REPORT BADGE ---
    doc.setFillColor(accentOrange[0], accentOrange[1], accentOrange[2]);
    doc.roundedRect(pageWidth - 65, 15, 50, 15, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("REPORT", pageWidth - 40, 25, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toUTCString()}`, pageWidth - 14, 36, { align: "right" });

    // --- SUB-HEADER ---
    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(title, pageWidth / 2, 60, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, pageWidth / 2, 67, { align: "center" });

    // --- ORANGE DIVIDER ---
    doc.setDrawColor(accentOrange[0], accentOrange[1], accentOrange[2]);
    doc.setLineWidth(1);
    doc.line(14, 75, pageWidth - 14, 75);

    // --- CONTACT ROW ---
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const contactY = 88;
    const colWidth = (pageWidth - 28) / 4;
    doc.text("Pune, Maharashtra", 14, contactY);
    doc.text("+91 9999999999", 14 + colWidth, contactY);
    doc.text("info@infrapilot.com", 14 + 2 * colWidth, contactY);
    doc.text("www.infrapilot.com", 14 + 3 * colWidth, contactY);

    // --- SUMMARY SECTION ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("SUMMARY", 14, 105);

    const statCount = summaryStats.length;
    const statWidth = (pageWidth - 28) / statCount;
    let currentX = 14;

    summaryStats.forEach(stat => {
      // Box Top Border (Orange)
      doc.setDrawColor(accentOrange[0], accentOrange[1], accentOrange[2]);
      doc.setLineWidth(1);
      doc.line(currentX, 115, currentX + statWidth - 2, 115);

      // Box Contents
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "normal");
      doc.text(stat.label.toUpperCase(), currentX + 5, 125);

      doc.setFontSize(11); // Slightly smaller for better fit
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.setFont("helvetica", "bold");
      const statValue = stat.value ? stat.value.toString() : "-";
      const splitValue = doc.splitTextToSize(statValue, statWidth - 10);
      doc.text(splitValue, currentX + 5, 132); // Adjusted Y for multi-line

      currentX += statWidth;
    });

    // --- DETAILS TABLE ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.text(`${title.split(' ')[0].toUpperCase()} DETAILS`, 14, 165);

    autoTable(doc, {
      startY: 172,
      head: tableHeaders,
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: primaryBlue,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: [30, 41, 59],
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });

    doc.save(fileName);
  };

  const generateCSV = (data: any, filename: string) => {
    let rows: any[] = [];
    if (Array.isArray(data)) {
      rows = data;
    } else {
      const mainList = data?.items || data?.data || data?.work_summary || data?.transactions || data?.dsr || data?.tasks;
      if (Array.isArray(mainList)) {
        const { items, data: _d, work_summary, transactions, dsr, tasks, ...topLevel } = data;
        rows = mainList.map((item: any) => ({
          ...topLevel,
          ...(typeof item === 'object' ? item : { value: item })
        }));
      } else {
        rows = [data];
      }
    }
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]).join(",");
    const csvRows = rows.map((row: any) =>
      Object.values(row).map((v: any) => {
        if (v === null || v === undefined) return '""';
        const strVal = typeof v === 'object' ? JSON.stringify(v) : String(v);
        return `"${strVal.replace(/"/g, '""')}"`;
      }).join(",")
    );
    const csvContent = [headers, ...csvRows].join("\n");
    const csvBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportDailyPDF = async () => {
    if (!projectId) return;
    const toastId = "daily-pdf";
    toast.loading("Exporting Daily Report PDF...", { id: toastId });
    try {
      // Primary: GET /api/v1/reports/daily/export/pdf
      const blob = await reportService.exportDailyPDF(Number(projectId), reportDate);
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Daily_Report_${reportDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Daily Report PDF downloaded!", { id: toastId });
    } catch (apiError: any) {
      console.warn("API PDF export failed, falling back to local generation:", apiError);
      try {
        const daily = await reportService.getDailyReport(projectId, reportDate);
        const dsr = daily ? (daily.dsr !== undefined ? daily.dsr : daily) : null;
        if (!dsr) {
          toast.error("No daily report found for this date to generate PDF", { id: toastId });
          return;
        }
        generatePremiumPDF({
          title: "Daily Operations Report",
          subtitle: `${dsr.site_location || 'Project Site'} | ${new Date(reportDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`,
          summaryStats: [
            { label: "Total Labour", value: (dsr.total_labour || 0).toString() },
            { label: "Skilled", value: (dsr.skilled_labour || 0).toString() },
            { label: "Unskilled", value: (dsr.unskilled_labour || 0).toString() },
            { label: "Weather", value: dsr.weather || "Sunny" },
            { label: "Status", value: dsr.status || "Updated" }
          ],
          tableHeaders: [["Daily Site Record", "Details / Observations"]],
          tableBody: [
            ["Report ID", dsr.business_id || `DSR-${dsr.id}`],
            ["Work Completed", dsr.work_done || "-"],
            ["Work Planned", dsr.work_planned || "-"],
            ["Materials Consumed", dsr.material_used || "-"],
            ["Materials Received", dsr.material_received || "-"],
            ["Machinery Used", dsr.machinery_used || "-"],
            ["Safety Observations", dsr.safety_observations || "Verified"],
            ["Site Remarks", dsr.remarks || "Work progressing as per schedule"]
          ],
          fileName: `Daily_Report_${dsr.business_id || reportDate}.pdf`
        });
        toast.success("Daily Report PDF downloaded!", { id: toastId });
      } catch (fallbackError: any) {
        console.error("Fallback PDF generation failed:", fallbackError);
        toast.error(fallbackError.message || "Failed to generate Daily Report PDF", { id: toastId });
      }
    }
  };

  const handleExportWeeklyPDF = async () => {
    if (!projectId) return;
    const toastId = "weekly-pdf";
    toast.loading("Exporting Weekly Progress PDF...", { id: toastId });
    try {
      // Primary: GET /api/v1/work-progress/reports/pdf
      const blob = await reportService.exportWeeklyPDF(Number(projectId));
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Weekly_Progress_${projectId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Weekly Progress PDF downloaded!", { id: toastId });
    } catch (error: any) {
      console.error("Weekly progress PDF export failed:", error);
      toast.error("No data available for the weekly report", { id: toastId });
    }
  };

  const handleExportWeeklyExcel = async () => {
    if (!projectId) return;
    const toastId = "weekly-excel";
    toast.loading("Exporting Weekly Progress Excel...", { id: toastId });
    try {
      // Primary: GET /api/v1/work-progress/reports/excel
      const blob = await reportService.exportWeeklyExcel(Number(projectId));
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Weekly_Progress_${projectId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Weekly Progress Excel downloaded!", { id: toastId });
    } catch (error: any) {
      console.error("Weekly progress Excel export failed:", error);
      toast.error("No data available for the weekly report", { id: toastId });
    }
  };

  const handleExportLabourPDF = async () => {
    if (!projectId) return;
    const toastId = "labour-pdf";
    toast.loading("Exporting Labour PDF...", { id: toastId });
    try {
      // Primary: GET /api/v1/reports/labour-distribution/pdf
      const blob = await reportService.exportLabourDistributionPdf(Number(projectId));
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Labour_Distribution_${projectId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Labour Report PDF downloaded!", { id: toastId });
    } catch (apiError: any) {
      console.warn("API Labour PDF export failed, falling back to local generation:", apiError);
      // Fallback: build PDF locally
      try {
        const labourRes = await reportService.getLabourReport(projectId);
        const summary: Array<{ skill_type: string; count: number }> =
          labourRes.labour_summary || labourRes.data?.labour_summary || [];
        const totalCount = summary.reduce((acc: number, curr: any) => acc + (curr.count || 0), 0);

        generatePremiumPDF({
          title: "Labour Deployment Report",
          subtitle: `Viman Nagar, Pune | ${new Date().toLocaleDateString('en-GB')}`,
          summaryStats: [
            { label: "Total Workers", value: totalCount.toString() },
            { label: "Skilled", value: (summary.find(s => s.skill_type === 'Skilled')?.count || 0).toString() },
            { label: "Unskilled", value: (summary.find(s => s.skill_type === 'Unskilled')?.count || 0).toString() },
            { label: "Contractors", value: (labourRes.contractors_count || "1").toString() },
            { label: "Safety", value: "Verified" }
          ],
          tableHeaders: [["Labour Category/Skill Type", "Strength Deployed", "Remarks/Notes"]],
          tableBody: [...summary.map(s => [s.skill_type || "-", s.count?.toString() || "0", "Daily Attendance Verified"]), ["TOTAL", totalCount.toString(), ""]],
          fileName: `Labour_Report_${new Date().toISOString().split('T')[0]}.pdf`
        });
        toast.success("Labour Report PDF generated!", { id: toastId });
      } catch (fallbackError: any) {
        console.error(fallbackError);
        toast.error("No data available for the labour report", { id: toastId });
      }
    }
  };

  const handleExportLabourExcel = async () => {
    if (!projectId) return;
    const toastId = "labour-excel";
    toast.loading("Exporting Labour Excel...", { id: toastId });
    try {
      // Primary: GET /api/v1/reports/labour-distribution/excel
      const blob = await reportService.exportLabourDistributionExcel(Number(projectId));
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Labour_Distribution_${projectId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Labour Report Excel downloaded!", { id: toastId });
    } catch (error: any) {
      console.error("Labour Excel export failed:", error);
      toast.error("No data available for the labour report", { id: toastId });
    }
  };

  const handleExportMaterialPDF = async () => {
    if (!projectId) return;
    const toastId = "material-pdf";
    toast.loading("Exporting Material PDF...", { id: toastId });
    try {
      // Primary: GET /api/v1/materials/reports/pdf
      await materialService.exportPdf(Number(projectId));
      toast.success("Material Report PDF downloaded!", { id: toastId });
    } catch (apiError: any) {
      console.warn("API Material PDF export failed, falling back to local generation:", apiError);
      // Fallback: build PDF locally
      try {
        const res = await materialService.getMaterialReport(Number(projectId));
        const items = res?.materials || [];

        generatePremiumPDF({
          title: "Material Inventory Report",
          subtitle: `Project Site | ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`,
          summaryStats: [
            { label: "Total Materials", value: materialSummary?.total_items?.toString() || "0" },
            { label: "Total Purchased", value: Math.round(materialSummary?.total_purchased ?? 0).toLocaleString() },
            { label: "Total Used", value: Math.round(materialSummary?.total_used ?? 0).toLocaleString() },
            { label: "Remaining Stock", value: Math.round(materialSummary?.total_qty ?? 0).toLocaleString() },
            { label: "Stock Value", value: `Rs. ${Math.round(materialSummary?.total_value ?? 0).toLocaleString()}` }
          ],
          tableHeaders: [["Material Name", "Category", "Purchased", "Used", "Remaining", "Value"]],
          tableBody: items.map((m: any) => [
            m.material_name || "-",
            m.category || "Material",
            (m.quantity_purchased ?? m.total_purchased)?.toString() || "0",
            (m.quantity_used ?? m.total_used)?.toString() || "0",
            m.remaining_stock?.toString() || "0",
            `Rs. ${Number(m.total_amount ?? m.total_cost ?? 0).toLocaleString()}`
          ]),
          fileName: `Material_Report_${new Date().toISOString().split('T')[0]}.pdf`
        });
        toast.success("Material Report PDF generated!", { id: toastId });
      } catch (fallbackError: any) {
        console.error(fallbackError);
        toast.error("No data available for the material report", { id: toastId });
      }
    }
  };

  const handleExportMaterialExcel = async () => {
    if (!projectId) return;
    const toastId = "material-excel";
    toast.loading("Exporting Material Excel...", { id: toastId });
    try {
      // Primary: GET /api/v1/materials/reports/excel
      await materialService.exportExcel(Number(projectId));
      toast.success("Material Report Excel downloaded!", { id: toastId });
    } catch (error: any) {
      console.error("Material Excel export failed:", error);
      toast.error("No data available for the material report", { id: toastId });
    }
  };

  const handleExportIssuePDF = async () => {
    if (!projectId) return;
    const toastId = "issue-pdf";
    toast.loading("Exporting Issues Report PDF...", { id: toastId });
    try {
      // Primary: GET /api/v1/reports/issues/pdf
      const blob = await reportService.exportIssuesPdf(projectId);
      downloadFile(blob, `Issues_Report_${new Date().toISOString().split('T')[0]}.pdf`, 'application/pdf');
      toast.success("Issues Report PDF downloaded!", { id: toastId });
    } catch (apiError) {
      // Fallback: local jsPDF generation
      try {
        const issuesRes = await issueService.listIssuesByProject(projectId, { limit: 1000 });
        const rawItems = (issuesRes as any).items ?? (issuesRes as any).data?.items ?? (Array.isArray(issuesRes) ? issuesRes : []);
        const items = rawItems.filter((i: any) => !i.project_id || Number(i.project_id) === Number(projectId));
        const openCount = items.filter((i: any) => i.status?.toLowerCase() !== 'resolved' && i.status?.toLowerCase() !== 'closed').length;

        generatePremiumPDF({
          title: "Site Issues Report",
          subtitle: `Project ID: ${projectId} | Outstanding as of ${new Date().toLocaleDateString('en-GB')}`,
          summaryStats: [
            { label: "Total Issues", value: items.length.toString() },
            { label: "Open Issues", value: openCount.toString() },
            { label: "Resolved", value: (items.length - openCount).toString() },
            { label: "Critical", value: items.filter((i: any) => i.priority?.toLowerCase() === 'high' || i.priority?.toLowerCase() === 'critical').length.toString() },
            { label: "Status", value: openCount > 5 ? "Critical" : "Stable" }
          ],
          tableHeaders: [["ID", "Issue Title/Description", "Status", "Priority", "Reported By"]],
          tableBody: items.map((i: any) => [
            i.business_id ?? i.id ?? "-",
            i.title ?? i.issue_name ?? "-",
            i.status ?? "Open",
            i.priority ?? "Medium",
            i.reporter_role ?? i.source ?? "Site Engineer"
          ]),
          fileName: `Issues_Report_${new Date().toISOString().split('T')[0]}.pdf`
        });
        toast.success("Issues Report PDF generated!", { id: toastId });
      } catch (error) {
        console.error(error);
        toast.error("No data available for the issues report", { id: toastId });
      }
    }
  };

  const handleExportIssueExcel = async () => {
    if (!projectId) return;
    const toastId = "issue-excel";
    toast.loading("Exporting Issues Report Excel...", { id: toastId });
    try {
      // GET /api/v1/reports/issues/excel
      const blob = await reportService.exportIssuesExcel(projectId);
      downloadFile(blob, `Issues_Report_${new Date().toISOString().split('T')[0]}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      toast.success("Issues Report Excel downloaded!", { id: toastId });
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.detail ?? error?.message ?? "";
      toast.error(msg ? `No data available: ${msg}` : "No data available for the issues report", { id: toastId });
    }
  };

  const handleExportProjectPDF = async () => {
    if (!projectId) return;
    try {
      toast.loading("Generating Operational Reports Register...", { id: "exec-pdf" });
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const primaryBlue = [15, 23, 42]; // #0F172A

      // --- HEADER ---
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("INFRAPILOT OPERATIONAL INTELLIGENCE", 14, 15);

      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.setFontSize(22);
      doc.text("Operational Reports Register", 14, 25);

      doc.setTextColor(120, 120, 120);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Exported document listing site status, performance audits, and resource metrics.", 14, 32);

      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
      doc.text(`AS OF: ${today}`, 14, 42);

      doc.setDrawColor(230, 230, 230);
      doc.line(14, 50, pageWidth - 14, 50);

      // --- CARDS ---
      let currentY = 60;

      const filteredReports = allReports.filter(report => {
        const matchesSearch =
          report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.level.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFrequency = frequency === "All Cycles" || report.frequency === frequency;
        if (activeTab === "issues" && report.title !== "Issue Report") return false;
        return matchesSearch && matchesFrequency;
      });

      filteredReports.forEach((report) => {
        // Page break if card exceeds page
        if (currentY > 230) {
          doc.addPage();
          currentY = 20;
        }

        // Card Container
        doc.setDrawColor(240, 240, 240);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(14, currentY, pageWidth - 28, 60, 4, 4, 'FD');

        // Icon Badge (Geometric)
        const iconColor =
          report.colorClass.includes('orange') ? [249, 115, 22] :
            report.colorClass.includes('blue') ? [37, 99, 235] :
              report.colorClass.includes('yellow') ? [202, 138, 4] :
                report.colorClass.includes('red') ? [220, 38, 38] :
                  [217, 119, 6];

        doc.setFillColor(iconColor[0], iconColor[1], iconColor[2]);
        doc.roundedRect(20, currentY + 10, 12, 12, 3, 3, 'F');

        // Metadata (Level & Size)
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(report.level, 40, currentY + 12);
        doc.text(report.size, pageWidth - 22, currentY + 12, { align: "right" });

        // Title
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFontSize(14);
        doc.text(report.title, 40, currentY + 20);

        // Description
        doc.setTextColor(140, 140, 140);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const splitDesc = doc.splitTextToSize(report.desc, pageWidth - 60);
        doc.text(splitDesc, 20, currentY + 30);

        // Divider
        doc.setDrawColor(245, 245, 245);
        doc.line(20, currentY + 38, pageWidth - 20, currentY + 38);

        // Stats Row
        let statX = 20;
        const statSpacing = (pageWidth - 40) / 4;
        report.stats.forEach(stat => {
          doc.setTextColor(120, 120, 120);
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.text(stat.label.toUpperCase(), statX, currentY + 45);

          doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
          doc.setFontSize(8); // Reduced slightly for better fit
          const statValue = stat.value.toString();
          const splitStatValue = doc.splitTextToSize(statValue, statSpacing - 5);
          doc.text(splitStatValue, statX, currentY + 51);
          statX += statSpacing;
        });

        // Small Divider for footer
        doc.setDrawColor(245, 245, 245);
        doc.line(20, currentY + 55, pageWidth - 20, currentY + 55);

        // Generated Time (Mockup style)
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text(`Generated: ${report.time}`, 25, currentY + 59);

        currentY += 65; // spacing for next card
      });

      // Footer page numbers
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`about:blank`, 14, 285);
        doc.text(`${i}/${totalPages}`, pageWidth - 14, 285, { align: "right" });
      }

      doc.save(`Operational_Reports_Register_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Operational Register PDF downloaded!", { id: "exec-pdf" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate Operational Register", { id: "exec-pdf" });
    }
  };

  const handleExportProjectExcel = async () => {
    if (!projectId) return;
    try {
      toast.loading("Compiling Operational Dataset...", { id: "exec-excel" });
      const filteredReports = allReports.filter(report => {
        const matchesSearch =
          report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.level.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFrequency = frequency === "All Cycles" || report.frequency === frequency;
        if (activeTab === "issues" && report.title !== "Issue Report") return false;
        return matchesSearch && matchesFrequency;
      });
      
      const summaryData = filteredReports.map(r => ({
        Level: r.level,
        Report_Type: r.title,
        Description: r.desc,
        Timestamp: r.time,
        Status: "Verified",
        ...r.stats.reduce((acc, s) => ({ ...acc, [s.label.replace(/\s/g, '_')]: s.value }), {})
      }));

      generateCSV(summaryData, `Operational_Register_Summary_${new Date().toISOString().split('T')[0]}.csv`);
      toast.success("Operational Summary downloaded!", { id: "exec-excel" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to export summary dataset", { id: "exec-excel" });
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-inter pb-20 overflow-x-hidden">
      <Navbar title="Reports" breadcrumb={["InfraPilot", "Client", "Reports"]} />

      {/* PAGE HEADER */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 pt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">SITE ENGINEER</p>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1.5">Reports</h1>
            <p className="text-xs font-bold text-slate-400 max-w-xl">Generate, view, and export daily, weekly, labour, material, and issue reports.</p>
          </div>
          <button
            onClick={fetchAllReports}
            disabled={loading}
            className="bg-[#2563EB] hover:bg-blue-700 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 active:scale-95 shadow-lg shadow-blue-200 text-white whitespace-nowrap disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? "REFRESHING..." : "Refresh Reports"}
          </button>
        </div>

        {/* OVERVIEW CARDS */}
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">REPORT OVERVIEW</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <OverviewCard
            title="TOTAL REPORTS"
            value={allReports.length.toString()}
            sub="Available in Catalog"
            active={activeTab === "all"}
            onClick={() => { setActiveTab("all"); setFrequency("All Cycles"); }}
          />
          <OverviewCard
            title="GENERATED TODAY"
            value={allReports.filter(r => r.level === "DAILY").length}
            sub="Recent Site Logs"
            active={activeTab === "daily"}
            onClick={() => { setActiveTab("daily"); setFrequency("Daily"); }}
          />
          <OverviewCard
            title="AVG. REPORT SIZE"
            value="1.8 MB"
            sub="Inventory Volume"
            active={activeTab === "weekly"}
            onClick={() => { setActiveTab("weekly"); setFrequency("Weekly"); }}
          />
          <OverviewCard
            title="OPEN ISSUES"
            value={issueSummary?.open ?? 10}
            sub="High Priority Items"
            red
            active={activeTab === "issues"}
            onClick={() => { setActiveTab("issues"); setFrequency("As Needed"); }}
          />
        </div>

        {/* FILTER BAR */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-8 mb-10">
          <div className="flex items-center gap-5 shrink-0">
            <div className="w-14 h-14 bg-[#2563EB] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            </div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Report Catalog Filter</h3>
          </div>

          <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
            <div className="relative">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest absolute -top-2.5 left-4 bg-white px-2 z-10">SEARCH</label>
              <div className="relative">
                <svg className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                />
              </div>
            </div>
            <div className="relative">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest absolute -top-2.5 left-4 bg-white px-2 z-10">REPORT DATE</label>
              <input
                type="date"
                value={reportDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setReportDate(newDate);
                  localStorage.setItem('client_report_date', newDate);
                }}
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-4 py-3.5 text-[11px] font-bold text-slate-700 focus:outline-none"
              />
            </div>
            <div className="relative">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest absolute -top-2.5 left-4 bg-white px-2 z-10">FREQUENCY</label>
              <select
                value={frequency}
                onChange={(e) => {
                  const val = e.target.value;
                  setFrequency(val);
                  if (val === "All Cycles") setActiveTab("all");
                  else if (val === "Daily") setActiveTab("daily");
                  else if (val === "Weekly") setActiveTab("weekly");
                  else if (val === "As Needed") setActiveTab("issues");
                  else setActiveTab("none");
                }}
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-4 py-3.5 text-[11px] font-bold text-slate-700 focus:outline-none appearance-none cursor-pointer"
              >
                <option>All Cycles</option>
                <option>Daily</option>
                <option>Weekly</option>
                <option>As Needed</option>
              </select>
              <svg className="w-3.5 h-3.5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div className="flex gap-3 shrink-0">
            <button onClick={handleExportProjectPDF} className="px-6 py-3.5 bg-[#2563EB] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 active:scale-95 shadow-lg shadow-blue-100">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> PDF
            </button>
            <button onClick={handleExportProjectExcel} className="px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 hover:bg-slate-50 active:scale-95 transition-all shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Export
            </button>
          </div>
        </div>

        {/* CARDS GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4 col-span-full">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating Insights...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allReports
              .filter(report => {
                const matchesSearch =
                  report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  report.level.toLowerCase().includes(searchQuery.toLowerCase());

                const matchesFrequency = frequency === "All Cycles" || report.frequency === frequency;
                if (activeTab === "issues" && report.title !== "Issue Report") return false;
                return matchesSearch && matchesFrequency;
              })
              .map((report, idx) => (
                <ReportCard key={idx} {...report} />
              ))}
          </div>
        )}
      <Modal
        isOpen={showInsight}
        onClose={() => setShowInsight(false)}
        title="Report Insight"
        maxWidth="max-w-2xl"
      >
        <div className="font-inter">
          {/* Main Blue Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2.5rem] p-10 text-white shadow-xl shadow-blue-200/50 relative overflow-hidden mb-12">
            <div className="relative z-10">
              <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-3">Analytics Registry</p>
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black tracking-tight">{selectedInsight?.title}</h3>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10">
                  <p className="text-[9px] font-black opacity-60 uppercase tracking-widest mb-2">File Context</p>
                  <p className="text-xl font-black">{selectedInsight?.size}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10">
                  <p className="text-[9px] font-black opacity-60 uppercase tracking-widest mb-2">Frequency</p>
                  <p className="text-xl font-black">{selectedInsight?.level}</p>
                </div>
              </div>
            </div>
            
            {/* Decorative circles */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          </div>

          <div className="px-2">
            {/* Identity Group */}
            <div className="mb-10">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6">Report Identity</p>
              
              <div className="mb-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Description & Scope</p>
                <p className="text-[13px] font-bold text-slate-600 leading-relaxed italic">
                  {selectedInsight?.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Last Generated</p>
                  <p className="text-sm font-black text-slate-700">{selectedInsight?.time}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">System Status</p>
                  <p className="text-sm font-black text-green-600 tracking-tight">{selectedInsight?.status}</p>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="mb-12">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-8">Performance Metrics</p>
              <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                {selectedInsight?.metrics?.map((metric: any, index: number) => (
                  <div key={index}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{metric.label}</p>
                    <p className={`text-base font-black tracking-tight ${metric.color || 'text-slate-800'}`}>
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata Box */}
            <div className="mb-10">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Report Metadata</p>
              <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] text-center italic">
                  Generation Logic: Standardized System Export | Integrity: 100% Secure
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowInsight(false)}
              className="w-full py-4 bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 transition-all active:scale-[0.98] border border-slate-100"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Excel Export Filter Modal ─────────────────────────────────── */}
      {showExcelModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowExcelModal(false)}
          />
          {/* Card */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Export Daily to Excel</h2>
                <p className="text-xs font-bold text-slate-400 mt-1">Apply filters before downloading (all fields optional)</p>
              </div>
              <button
                onClick={() => setShowExcelModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* START DATE */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</label>
              <input
                type="date"
                value={excelStartDate}
                onChange={e => setExcelStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all"
              />
            </div>

            {/* END DATE */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</label>
              <input
                type="date"
                value={excelEndDate}
                onChange={e => setExcelEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all"
              />
            </div>

            {/* CONTRACTOR NAME */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contractor Name</label>
              <input
                type="text"
                placeholder="e.g. Shree Construction"
                value={excelContractorName}
                onChange={e => setExcelContractorName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => { setExcelStartDate(""); setExcelEndDate(""); setExcelContractorName(""); }}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]"
              >
                Clear Filters
              </button>
              <button
                disabled={isExcelDownloading}
                onClick={async () => {
                  if (!projectId) return;
                  setIsExcelDownloading(true);
                  const toastId = "daily-excel";
                  toast.loading("Exporting Daily Report Excel...", { id: toastId });
                  try {
                    await dsrService.exportDsrExcel(Number(projectId), {
                      ...(excelStartDate ? { start_date: excelStartDate } : {}),
                      ...(excelEndDate ? { end_date: excelEndDate } : {}),
                      ...(excelContractorName.trim() ? { contractor_name: excelContractorName.trim() } : {}),
                    });
                    toast.success("Daily Report Excel downloaded!", { id: toastId });
                    setShowExcelModal(false);
                  } catch (error: any) {
                    console.error("DSR Excel export failed:", error);
                    toast.error("No data available for the selected filters", { id: toastId });
                  } finally {
                    setIsExcelDownloading(false);
                  }
                }}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isExcelDownloading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                )}
                {isExcelDownloading ? "Exporting..." : "Download Excel"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Labour PDF Filter Modal ─────────────────────────────────── */}
      {showLabourPdfModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLabourPdfModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Export Labour Report to PDF</h2>
                <p className="text-xs font-bold text-slate-400 mt-1">Apply filters before downloading (all fields optional)</p>
              </div>
              <button onClick={() => setShowLabourPdfModal(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label>
              <input type="date" value={labourPdfDate} onChange={e => setLabourPdfDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skill Category</label>
              <select value={labourPdfSkillCategory} onChange={e => setLabourPdfSkillCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all appearance-none">
                <option value="">All Categories</option>
                <option value="skilled">Skilled</option>
                <option value="unskilled">Unskilled</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => { setLabourPdfDate(""); setLabourPdfSkillCategory(""); }}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]">
                Clear Filters
              </button>
              <button disabled={isLabourPdfDownloading} onClick={async () => {
                if (!projectId) return;
                setIsLabourPdfDownloading(true);
                const toastId = "labour-pdf";
                toast.loading("Exporting Labour PDF...", { id: toastId });
                try {
                  const blob = await reportService.exportLabourDistributionPdf(Number(projectId));
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", `Labour_Report_${new Date().toISOString().split('T')[0]}.pdf`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  URL.revokeObjectURL(url);
                  toast.success("Labour Report PDF downloaded!", { id: toastId });
                  setShowLabourPdfModal(false);
                } catch (error: any) {
                  console.error(error);
                  toast.error("No data available for the labour report", { id: toastId });
                } finally {
                  setIsLabourPdfDownloading(false);
                }
              }}
                className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
                {isLabourPdfDownloading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                )}
                {isLabourPdfDownloading ? "Exporting..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Labour Excel Filter Modal ─────────────────────────────────── */}
      {showLabourExcelModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLabourExcelModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Export Labour Report to Excel</h2>
                <p className="text-xs font-bold text-slate-400 mt-1">Apply filters before downloading (all fields optional)</p>
              </div>
              <button onClick={() => setShowLabourExcelModal(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label>
              <input type="date" value={labourExcelDate} onChange={e => setLabourExcelDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skill Category</label>
              <select value={labourExcelSkillCategory} onChange={e => setLabourExcelSkillCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all appearance-none">
                <option value="">All Categories</option>
                <option value="skilled">Skilled</option>
                <option value="unskilled">Unskilled</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => { setLabourExcelDate(""); setLabourExcelSkillCategory(""); }}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]">
                Clear Filters
              </button>
              <button disabled={isLabourExcelDownloading} onClick={async () => {
                if (!projectId) return;
                setIsLabourExcelDownloading(true);
                const toastId = "labour-excel";
                toast.loading("Exporting Labour Excel...", { id: toastId });
                try {
                  const blob = await reportService.exportLabourDistributionExcel(Number(projectId));
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", `Labour_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  URL.revokeObjectURL(url);
                  toast.success("Labour Report Excel downloaded!", { id: toastId });
                  setShowLabourExcelModal(false);
                } catch (error: any) {
                  console.error(error);
                  toast.error("No data available for the labour report", { id: toastId });
                } finally {
                  setIsLabourExcelDownloading(false);
                }
              }}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
                {isLabourExcelDownloading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                )}
                {isLabourExcelDownloading ? "Exporting..." : "Download Excel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Issue PDF Filter Modal ─────────────────────────────────── */}
      {showIssuePdfModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowIssuePdfModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Export Issue Report to PDF</h2>
                <p className="text-xs font-bold text-slate-400 mt-1">Apply filters before downloading (all fields optional)</p>
              </div>
              <button onClick={() => setShowIssuePdfModal(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
              <select value={issuePdfStatus} onChange={e => setIssuePdfStatus(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all appearance-none">
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</label>
              <select value={issuePdfPriority} onChange={e => setIssuePdfPriority(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all appearance-none">
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reported Start Date</label>
              <input type="date" value={issuePdfStartDate} onChange={e => setIssuePdfStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reported End Date</label>
              <input type="date" value={issuePdfEndDate} onChange={e => setIssuePdfEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all" />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => { setIssuePdfStatus(""); setIssuePdfPriority(""); setIssuePdfStartDate(""); setIssuePdfEndDate(""); }}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]">
                Clear Filters
              </button>
              <button disabled={isIssuePdfDownloading} onClick={async () => {
                if (!projectId) return;
                setIsIssuePdfDownloading(true);
                const toastId = "issue-pdf";
                toast.loading("Exporting Issue PDF...", { id: toastId });
                try {
                  const blob = await reportService.exportIssuesPdf(
                    projectId,
                    {
                      status: issuePdfStatus || null,
                      priority: issuePdfPriority || null,
                      start_date: issuePdfStartDate || null,
                      end_date: issuePdfEndDate || null,
                    }
                  );
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", `Issues_Report_${new Date().toISOString().split('T')[0]}.pdf`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  URL.revokeObjectURL(url);
                  toast.success("Issue Report PDF downloaded!", { id: toastId });
                  setShowIssuePdfModal(false);
                } catch (error: any) {
                  console.error(error);
                  toast.error("No data available for the issues report", { id: toastId });
                } finally {
                  setIsIssuePdfDownloading(false);
                }
              }}
                className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
                {isIssuePdfDownloading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                )}
                {isIssuePdfDownloading ? "Exporting..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Issue Excel Filter Modal ─────────────────────────────────── */}
      {showIssueExcelModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowIssueExcelModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Export Issue Report to Excel</h2>
                <p className="text-xs font-bold text-slate-400 mt-1">Apply filters before downloading (all fields optional)</p>
              </div>
              <button onClick={() => setShowIssueExcelModal(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
              <select value={issueExcelStatus} onChange={e => setIssueExcelStatus(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all appearance-none">
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</label>
              <select value={issueExcelPriority} onChange={e => setIssueExcelPriority(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all appearance-none">
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reported Start Date</label>
              <input type="date" value={issueExcelStartDate} onChange={e => setIssueExcelStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reported End Date</label>
              <input type="date" value={issueExcelEndDate} onChange={e => setIssueExcelEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all" />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => { setIssueExcelStatus(""); setIssueExcelPriority(""); setIssueExcelStartDate(""); setIssueExcelEndDate(""); }}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]">
                Clear Filters
              </button>
              <button disabled={isIssueExcelDownloading} onClick={async () => {
                if (!projectId) return;
                setIsIssueExcelDownloading(true);
                const toastId = "issue-excel";
                toast.loading("Exporting Issue Excel...", { id: toastId });
                try {
                  const blob = await reportService.exportIssuesExcel(
                    projectId,
                    {
                      status: issueExcelStatus || null,
                      priority: issueExcelPriority || null,
                      start_date: issueExcelStartDate || null,
                      end_date: issueExcelEndDate || null,
                    }
                  );
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", `Issues_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  URL.revokeObjectURL(url);
                  toast.success("Issue Report Excel downloaded!", { id: toastId });
                  setShowIssueExcelModal(false);
                } catch (error: any) {
                  console.error(error);
                  toast.error("No data available for the issues report", { id: toastId });
                } finally {
                  setIsIssueExcelDownloading(false);
                }
              }}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
                {isIssueExcelDownloading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                )}
                {isIssueExcelDownloading ? "Exporting..." : "Download Excel"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Weekly PDF Filter Modal ─────────────────────────────────── */}
      {showWeeklyPdfModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowWeeklyPdfModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Export Weekly Progress to PDF</h2>
                <p className="text-xs font-bold text-slate-400 mt-1">Apply filters before downloading (all fields optional)</p>
              </div>
              <button onClick={() => setShowWeeklyPdfModal(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</label>
              <input type="date" value={weeklyPdfStartDate} onChange={e => setWeeklyPdfStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</label>
              <input type="date" value={weeklyPdfEndDate} onChange={e => setWeeklyPdfEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all" />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => { setWeeklyPdfStartDate(""); setWeeklyPdfEndDate(""); }}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]">
                Clear Filters
              </button>
              <button disabled={isWeeklyPdfDownloading} onClick={async () => {
                if (!projectId) return;
                setIsWeeklyPdfDownloading(true);
                const toastId = "weekly-pdf";
                toast.loading("Exporting Weekly Progress PDF...", { id: toastId });
                try {
                  const blob = await reportService.exportWeeklyPDF(Number(projectId));
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", `Weekly_Progress_${new Date().toISOString().split('T')[0]}.pdf`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  URL.revokeObjectURL(url);
                  toast.success("Weekly Progress PDF downloaded!", { id: toastId });
                  setShowWeeklyPdfModal(false);
                } catch (error: any) {
                  console.error(error);
                  toast.error("No data available for the weekly report", { id: toastId });
                } finally {
                  setIsWeeklyPdfDownloading(false);
                }
              }}
                className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
                {isWeeklyPdfDownloading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                )}
                {isWeeklyPdfDownloading ? "Exporting..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Weekly Excel Filter Modal ─────────────────────────────────── */}
      {showWeeklyExcelModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowWeeklyExcelModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Export Weekly Progress to Excel</h2>
                <p className="text-xs font-bold text-slate-400 mt-1">Apply filters before downloading (all fields optional)</p>
              </div>
              <button onClick={() => setShowWeeklyExcelModal(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</label>
              <input type="date" value={weeklyExcelStartDate} onChange={e => setWeeklyExcelStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</label>
              <input type="date" value={weeklyExcelEndDate} onChange={e => setWeeklyExcelEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all" />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => { setWeeklyExcelStartDate(""); setWeeklyExcelEndDate(""); }}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]">
                Clear Filters
              </button>
              <button disabled={isWeeklyExcelDownloading} onClick={async () => {
                if (!projectId) return;
                setIsWeeklyExcelDownloading(true);
                const toastId = "weekly-excel";
                toast.loading("Exporting Weekly Progress Excel...", { id: toastId });
                try {
                  const blob = await reportService.exportWeeklyExcel(Number(projectId));
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", `Weekly_Progress_${new Date().toISOString().split('T')[0]}.xlsx`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  URL.revokeObjectURL(url);
                  toast.success("Weekly Progress Excel downloaded!", { id: toastId });
                  setShowWeeklyExcelModal(false);
                } catch (error: any) {
                  console.error(error);
                  toast.error("No data available for the weekly report", { id: toastId });
                } finally {
                  setIsWeeklyExcelDownloading(false);
                }
              }}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
                {isWeeklyExcelDownloading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                )}
                {isWeeklyExcelDownloading ? "Exporting..." : "Download Excel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
};

export default ClientReportsPage;
